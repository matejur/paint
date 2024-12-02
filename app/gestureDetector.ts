import { HandLandmarkerResult, Landmark } from "@mediapipe/tasks-vision";
import { getLandmarksByName } from "./handModel";
import { Vector } from "./vector";
import { Figure, Rectangle } from "./drawing";

const INDEX_TIP = 8;
const THUMB = [1, 2, 3, 4];
const INDEX = [5, 6, 7, 8];
const MIDDLE = [9, 10, 11, 12];
const RING = [13, 14, 15, 16];
const PINKY = [17, 18, 19, 20];
const FINGERS = [
  { name: "thumb", points: THUMB },
  { name: "index", points: INDEX },
  { name: "middle", points: MIDDLE },
  { name: "ring", points: RING },
  { name: "pinky", points: PINKY },
];

type Shape = "RECTANGLE" | "TRIANGLE";
type HandName = "Left" | "Right";

interface HandFingers {
  thumb: Finger;
  index: Finger;
  middle: Finger;
  ring: Finger;
  pinky: Finger;
}

class FingerPart {
  depth: number;
  direction: Vector;
  slope: number;
  intercept: number;

  constructor(a: Landmark, b: Landmark) {
    this.slope = (b.y - a.y) / (b.x - a.x);
    this.intercept = a.y - this.slope * a.x;
    this.direction = new Vector(b.x - a.x, b.y - a.y);
    this.depth = (a.z + b.z) / 2;
  }
}

interface Finger {
  tip: Vector;
  top: FingerPart;
  middle: FingerPart;
  base: FingerPart;
}

class ClickDetector {
  handName: HandName;
  depthHistory: number[];
  onClick: (x: number, y: number) => void;

  historySize: number = 20;

  constructor(handName: HandName) {
    this.handName = handName;
    this.depthHistory = [];
  }

  update(results: HandLandmarkerResult) {
    const landmarks = getLandmarksByName(results, this.handName);
    if (!landmarks) {
      this.depthHistory = [];
      return;
    }

    const fingers = detectFingers(landmarks);
    const select = is_select_gesture(fingers);

    if (select) {
      this.depthHistory.push(fingers.index.top.depth);
      if (this.depthHistory.length > this.historySize) {
        this.depthHistory.shift();
      }
    } else {
      this.depthHistory = [];
    }

    if (this.depthHistory.length === this.historySize) {
      const first_part = this.depthHistory.slice(0, this.historySize * 0.75);
      const second_part = this.depthHistory.slice(this.historySize * 0.75);

      const first_avg = first_part.reduce((a, b) => a + b) / first_part.length;
      const second_avg =
        second_part.reduce((a, b) => a + b) / second_part.length;

      const first_std = Math.sqrt(
        first_part
          .map((x) => Math.pow(x - first_avg, 2))
          .reduce((a, b) => a + b) / first_part.length
      );
      const second_std = Math.sqrt(
        second_part
          .map((x) => Math.pow(x - second_avg, 2))
          .reduce((a, b) => a + b) / second_part.length
      );

      if (
        (first_avg - second_avg) * 1000 > 15 &&
        first_std * 1000 < 3 &&
        second_std * 1000 > 5
      ) {
        this.onClick(landmarks[INDEX_TIP].x, landmarks[INDEX_TIP].y);
        this.depthHistory = [];
      }
    }
  }
}

function detectFingers(landmarks: Landmark[]): HandFingers {
  let hand = {} as HandFingers;
  FINGERS.forEach((finger) => {
    const points = finger.points;
    const [a, b, c, d] = points;

    hand[finger.name] = {} as Finger;
    hand[finger.name].tip = new Vector(landmarks[d].x, landmarks[d].y);
    hand[finger.name].top = new FingerPart(landmarks[c], landmarks[d]);
    hand[finger.name].middle = new FingerPart(landmarks[b], landmarks[c]);
    hand[finger.name].base = new FingerPart(landmarks[a], landmarks[b]);
  });

  return hand;
}
function detectShape(results: HandLandmarkerResult): Figure | undefined {
  const leftLandmarks = getLandmarksByName(results, "Left");
  const rightLandmarks = getLandmarksByName(results, "Right");

  if (!leftLandmarks || !rightLandmarks) {
    return;
  }

  const leftfingers = detectFingers(leftLandmarks);
  const rightfingers = detectFingers(rightLandmarks);

  const leftThumb = leftfingers.thumb.top;
  const rightThumb = rightfingers.thumb.top;
  const leftIndex = leftfingers.index.middle;
  const rightIndex = rightfingers.index.middle;

  // Between thumbs
  const angle1 = leftThumb.direction.angleTo(rightThumb.direction);

  // Between index fingers
  const angle2 = leftIndex.direction.angleTo(rightIndex.direction);

  if (angle1 > 170 && angle2 > 170) {
    return new Rectangle([
      intersect(leftThumb, rightIndex),
      intersect(rightThumb, leftIndex),
    ]);
  } else if (angle1 > 170 && angle2 > 70 && angle2 < 90) {
    return;
  }
}

function intersect(a: FingerPart, b: FingerPart): Vector {
  const x = (a.intercept - b.intercept) / (b.slope - a.slope);
  const y = a.slope * x + a.intercept;
  return new Vector(x, y);
}

function isPinching(
  results: HandLandmarkerResult,
  hand: HandName
): [boolean, Vector] {
  const [zoom, indexTip, thumbTip] = zoomGesture(results, hand);
  const distance = indexTip.distanceTo(thumbTip);
  if (zoom && distance < 50) {
    const middle_x = (thumbTip.x + indexTip.x) / 2;
    const middle_y = (thumbTip.y + indexTip.y) / 2;
    return [true, new Vector(middle_x, middle_y)];
  }

  return [false, new Vector(0, 0)];
}

function zoomGesture(
  results: HandLandmarkerResult,
  hand: HandName
): [boolean, Vector, Vector] {
  const landmarks = getLandmarksByName(results, hand);
  if (!landmarks) {
    return [false, new Vector(0, 0), new Vector(0, 0)];
  }

  const fingers = detectFingers(landmarks);
  const middle_curled = curled_finger(fingers.middle);
  const ring_curled = curled_finger(fingers.ring);
  const pinky_curled = curled_finger(fingers.pinky);

  if (middle_curled && ring_curled && pinky_curled) {
    return [true, fingers.index.tip, fingers.thumb.tip];
  } else {
    return [false, new Vector(0, 0), new Vector(0, 0)];
  }
}

function curled_finger(finger: Finger): boolean {
  return finger.middle.direction.y > 0;
}

function is_select_gesture(fingers: HandFingers): boolean {
  const index_curled = curled_finger(fingers.index);
  const middle_curled = curled_finger(fingers.middle);
  const ring_curled = curled_finger(fingers.ring);
  const pinky_curled = curled_finger(fingers.pinky);

  return !index_curled && middle_curled && ring_curled && pinky_curled;
}

export { detectFingers, detectShape, isPinching, ClickDetector, zoomGesture };
