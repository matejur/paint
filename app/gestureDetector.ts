import { HandLandmarkerResult, Landmark } from "@mediapipe/tasks-vision";
import { getLandmarksByName } from "./handModel";

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

interface HandFingers {
  thumb: Finger;
  index: Finger;
  middle: Finger;
  ring: Finger;
  pinky: Finger;
}

interface Finger {
  slope: number;
  intercept: number;
}

function detectFingers(landmarks: Landmark[]): HandFingers {
  let hand = {
    thumb: { slope: 0, intercept: 0 },
    index: { slope: 0, intercept: 0 },
    middle: { slope: 0, intercept: 0 },
    ring: { slope: 0, intercept: 0 },
    pinky: { slope: 0, intercept: 0 },
  };
  FINGERS.forEach((finger) => {
    const points = finger.points;
    const [a, b, c, d] = points;
    const fingerPoints = [
      landmarks[a],
      landmarks[b],
      landmarks[c],
      landmarks[d],
    ];

    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumXX = 0;
    fingerPoints.forEach((point) => {
      sumX += point.x;
      sumY += point.y;
      sumXX += point.x * point.x;
      sumXY += point.x * point.y;
    });

    const n = fingerPoints.length;
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    hand[finger.name] = { slope, intercept };
  });
  return hand;
}

function detectShape(results: HandLandmarkerResult): Shape | undefined {
  const leftLandmarks = getLandmarksByName(results, "Left");
  const rightLandmarks = getLandmarksByName(results, "Right");

  if (!leftLandmarks || !rightLandmarks) {
    return;
  }

  const leftfingers = detectFingers(leftLandmarks);
  const rightfingers = detectFingers(rightLandmarks);

  const leftThumb = leftfingers.thumb;
  const rightThumb = rightfingers.thumb;
  const leftIndex = leftfingers.index;
  const rightIndex = rightfingers.index;

  const angle1 =
    (Math.abs(
      Math.atan(
        (leftThumb.slope - rightThumb.slope) /
          (1 + leftThumb.slope * rightThumb.slope)
      )
    ) *
      180) /
    Math.PI;
  const angle2 =
    (Math.abs(
      Math.atan(
        (leftIndex.slope - rightIndex.slope) /
          (1 + leftIndex.slope * rightIndex.slope)
      )
    ) *
      180) /
    Math.PI;

  if (angle1 < 10 && angle2 < 10) {
    return "RECTANGLE";
  } else if (angle1 < 10 && angle2 > 70) {
    return "TRIANGLE";
  }
}

export { detectFingers, detectShape };
