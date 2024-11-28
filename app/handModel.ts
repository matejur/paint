import {
  FilesetResolver,
  HandLandmarker,
  HandLandmarkerResult,
  Landmark,
} from "@mediapipe/tasks-vision";

async function createHandModel(): Promise<HandLandmarker> {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );
  const handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numHands: 2,
  });

  return handLandmarker;
}

function transformToCanvasCoords(
  results: HandLandmarkerResult,
  width: number,
  height: number
) {
  results.landmarks.forEach((landmark) => {
    landmark.forEach((point) => {
      point.x = width * (1 - point.x);
      point.y *= height;
    });
  });
}

function getLandmarksByName(
  hands: HandLandmarkerResult,
  handName: "Left" | "Right"
): Landmark[] {
  const handIndex = hands.handedness.findIndex(
    // Hands are swapped for some reason
    (hand) => hand[0].categoryName !== handName
  );

  return hands.landmarks[handIndex];
}

export { createHandModel, transformToCanvasCoords, getLandmarksByName };
