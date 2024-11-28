import { HandLandmarker } from "@mediapipe/tasks-vision";
import {
  createHandModel,
  getLandmarksByName,
  transformToCanvasCoords,
} from "./handModel";
import { Visualizer } from "./vis";
import { detectFingers, detectShape } from "./gestureDetector";

const video = document.getElementById("webcam") as HTMLVideoElement;
const canvasElement = document.getElementById(
  "output_canvas"
) as HTMLCanvasElement;
const ctx = canvasElement.getContext("2d");
const vis = new Visualizer(ctx);

let handModel: HandLandmarker;
let cameraReady = false;

let WIDTH = 640;
let HEIGHT = 480;

function enableCamera() {
  // getUsermedia parameters.
  const constraints = {
    video: {
      width: {
        min: 640,
        ideal: 900,
        max: 1920,
      },
    },
  };

  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    video.srcObject = stream;
    video.addEventListener("loadeddata", () => {
      canvasElement.style.width = video.videoWidth.toString();
      canvasElement.style.height = video.videoHeight.toString();
      canvasElement.width = video.videoWidth;
      canvasElement.height = video.videoHeight;

      WIDTH = video.videoWidth;
      HEIGHT = video.videoHeight;

      cameraReady = true;
    });
  });
}

async function main() {
  handModel = await createHandModel();
  const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;

  if (!hasGetUserMedia()) {
    alert("Webcam is not supported by your browser");
    return;
  }

  enableCamera();

  requestAnimationFrame(loop);
}

async function loop() {
  if (!cameraReady) {
    requestAnimationFrame(loop);
    return;
  }
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  let startTimeMs = performance.now();
  const hands = handModel.detectForVideo(video, startTimeMs);
  transformToCanvasCoords(hands, WIDTH, HEIGHT);

  vis.setHands(hands);
  vis.drawConnections();
  vis.drawPoints();
  vis.drawFingerLines();

  console.log(detectShape(hands));

  requestAnimationFrame(loop);
}

document.addEventListener("DOMContentLoaded", main);
