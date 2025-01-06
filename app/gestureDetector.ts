import { HandLandmarkerResult, Landmark } from "@mediapipe/tasks-vision";
import { getLandmarksByName } from "./handModel";
import { Vector } from "./vector";
import { Circle, Polygon } from "./geometry";

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
  position: Vector;

  constructor(a: Landmark, b: Landmark) {
    this.slope = (b.y - a.y) / (b.x - a.x);
    this.intercept = a.y - this.slope * a.x;
    this.direction = new Vector(b.x - a.x, b.y - a.y).normalize();
    this.depth = (a.z + b.z) / 2;
    this.position = new Vector(a.x, a.y);
  }
}

interface Finger {
  tip: Vector;
  top: FingerPart;
  middle: FingerPart;
  base: FingerPart;
}

class GestureDetector {
  handName: HandName;
  depthHistory: number[];

  historySize: number = 30;

  constructor(handName: HandName) {
    this.handName = handName;
    this.depthHistory = [];
  }

  onClick(pos: Vector): void {}
  onDrag(pos: Vector): void {}
  onDragStop(): void {}

  update(results: HandLandmarkerResult) {
    const landmarks = getLandmarksByName(results, this.handName);
    if (!landmarks) {
      this.depthHistory = [];
      return;
    }

    const wrist = new Vector(landmarks[0].x, landmarks[0].y);
    const indexStart = new Vector(landmarks[INDEX[0]].x, landmarks[INDEX[0]].y);
    const handSize = wrist.distanceTo(indexStart);

    const fingers = detectFingers(landmarks);

    const pinching = isPinching(fingers, handSize * 0.25);
    if (pinching[0]) {
      this.onDrag(pinching[1]);
      return;
    } else {
      this.onDragStop();
    }

    const select = isSelectGesture(fingers, handSize * 0.3);
    console.log(select);
    if (select) {
      this.depthHistory.push(fingers.index.top.depth);
      if (this.depthHistory.length > this.historySize) {
        this.depthHistory.shift();
      }
    } else {
      this.depthHistory = [];
    }

    if (select && this.depthHistory.length === this.historySize) {
      const first_part = this.depthHistory.slice(0, this.historySize * 0.9);
      const second_part = this.depthHistory.slice(this.historySize * 0.9);

      const history_avg =
        first_part.reduce((a, b) => a + b, 0) / first_part.length;
      const min = Math.min(...second_part);
      if (history_avg * 1.5 > min) {
        this.onClick(fingers.index.tip);
        this.depthHistory = [];
      }

      // if (
      //   (first_avg - second_avg) * 1000 > 15 &&
      //   first_std * 1000 < 3 &&
      //   second_std * 1000 > 5
      // ) {
      //   this.onClick(
      //     new Vector(landmarks[INDEX_TIP].x, landmarks[INDEX_TIP].y)
      //   );
      //   this.depthHistory = [];
      // }
    }
  }
}

function detectFingers(landmarks: Landmark[]): HandFingers {
  if (!landmarks) return undefined;
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
function detectShape(
  results: HandLandmarkerResult
): Circle | Polygon | undefined {
  const leftLandmarks = getLandmarksByName(results, "Left");
  const rightLandmarks = getLandmarksByName(results, "Right");

  if (!leftLandmarks || !rightLandmarks) {
    if (rightLandmarks) {
      const rightFingers = detectFingers(rightLandmarks);

      const middleUp = rightFingers.middle.top.direction.y < -0.5;
      const ringUp = rightFingers.ring.top.direction.y < -0.5;
      const pinkyUp = rightFingers.pinky.top.direction.y < -0.5;

      const wrist = new Vector(rightLandmarks[0].x, rightLandmarks[0].y);
      const indexStart = new Vector(
        rightLandmarks[INDEX[0]].x,
        rightLandmarks[INDEX[0]].y
      );
      const handSize = wrist.distanceTo(indexStart);

      const thumbIndexTouching =
        rightFingers.thumb.tip.distanceTo(rightFingers.index.tip) <
        0.25 * handSize;

      if (thumbIndexTouching && middleUp && ringUp && pinkyUp) {
        const center = new Vector(
          (rightLandmarks[INDEX[1]].x + rightLandmarks[THUMB[1]].x) / 2,
          (rightLandmarks[INDEX[1]].y + rightLandmarks[THUMB[1]].y) / 2
        );

        const radius = new Vector(
          rightLandmarks[INDEX_TIP].x,
          rightLandmarks[INDEX_TIP].y
        ).distanceTo(center);

        if (radius > 30) {
          return new Circle(center, radius);
        }
      }
    }
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
    // RECTANGLE
    const topLeft = intersect(leftThumb, leftIndex);
    const bottomRight = intersect(rightThumb, rightIndex);

    const topRight = new Vector(bottomRight.x, topLeft.y);
    const bottomLeft = new Vector(topLeft.x, bottomRight.y);
    return new Polygon([topLeft, topRight, bottomRight, bottomLeft]);
  } else if (angle1 > 170 && angle2 > 70 && angle2 < 90) {
    // TRIANGLE
    const peak = intersect(leftIndex, rightIndex);
    const left = intersect(leftThumb, leftIndex);
    const right = intersect(rightThumb, rightIndex);

    return new Polygon([left, peak, right]);
  }
}

function intersect(a: FingerPart, b: FingerPart): Vector {
  const x = (a.intercept - b.intercept) / (b.slope - a.slope);
  const y = a.slope * x + a.intercept;
  return new Vector(x, y);
}

function isPinching(
  fingers: HandFingers,
  distThreshold: number
): [boolean, Vector] {
  if (!fingers) return [false, new Vector(0, 0)];
  const [zoom, indexTip, thumbTip] = zoomGesture(fingers);
  const distance = indexTip.distanceTo(thumbTip);
  if (zoom && distance < distThreshold) {
    const middle_x = (thumbTip.x + indexTip.x) / 2;
    const middle_y = (thumbTip.y + indexTip.y) / 2;
    return [true, new Vector(middle_x, middle_y)];
  }

  return [false, new Vector(0, 0)];
}

function zoomGesture(fingers: HandFingers): [boolean, Vector, Vector] {
  if (!fingers) return [false, new Vector(0, 0), new Vector(0, 0)];
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
  return finger.base.direction.dot(finger.top.direction) < -0.3;
}

function isSelectGesture(
  fingers: HandFingers,
  thumbIndexThreshold: number
): boolean {
  const middle_down = fingers.middle.middle.direction.y > 0;
  const ring_down = fingers.ring.middle.direction.y > 0;
  const pinky_down = fingers.pinky.middle.direction.y > 0;

  const thumb_middle_dist = fingers.thumb.tip.distanceTo(
    fingers.middle.middle.position
  );

  return (
    middle_down &&
    ring_down &&
    pinky_down &&
    thumb_middle_dist < thumbIndexThreshold
  );
}

function below(fingerA: Finger, fingerB: Finger): boolean {
  return fingerA.tip.y > fingerB.tip.y;
}

function isThumbsUpOrDown(fingers: HandFingers): [boolean, "up" | "down"] {
  if (!fingers) return [false, "up"];
  if (Math.abs(fingers.index.top.direction.y) > 0.3) return [false, "up"];

  const thumb_curled = curled_finger(fingers.thumb);
  const index_curled = curled_finger(fingers.index);
  const middle_curled = curled_finger(fingers.middle);
  const ring_curled = curled_finger(fingers.ring);
  const pinky_curled = curled_finger(fingers.pinky);

  if (
    !thumb_curled &&
    index_curled &&
    middle_curled &&
    ring_curled &&
    pinky_curled
  ) {
    if (
      fingers.thumb.top.direction.y < -0.9 &&
      below(fingers.index, fingers.thumb)
    )
      return [true, "up"];
    if (
      fingers.thumb.top.direction.y > 0.9 &&
      below(fingers.thumb, fingers.index)
    )
      return [true, "down"];
  }
  return [false, "up"];
}

export {
  detectFingers,
  detectShape,
  isPinching,
  GestureDetector,
  zoomGesture,
  isThumbsUpOrDown,
};
