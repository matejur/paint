import { HandLandmarker } from "@mediapipe/tasks-vision";
import {
  createHandModel,
  getLandmarksByName,
  transformToCanvasCoords,
} from "./handModel";
import { Visualizer } from "./vis";
import {
  detectFingers,
  detectShape,
  ClickDetector,
  is_draw_gesture,
} from "./gestureDetector";
import { ColorSelector, Menu } from "./menuItems";

const video = document.getElementById("webcam") as HTMLVideoElement;
const clearedCanvasElement = document.getElementById(
  "cleared_canvas"
) as HTMLCanvasElement;
const drawingCanvasElement = document.getElementById(
  "drawing_canvas"
) as HTMLCanvasElement;
const clearedCtx = clearedCanvasElement.getContext("2d");
const drawingCtx = drawingCanvasElement.getContext("2d");

const vis = new Visualizer(clearedCtx);

let handModel: HandLandmarker;
let menu: Menu;
let cameraReady = false;
let debug = true;

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
      configure();
      cameraReady = true;
    });
  });
}

function configure() {
  clearedCanvasElement.style.width = video.videoWidth.toString();
  clearedCanvasElement.style.height = video.videoHeight.toString();
  clearedCanvasElement.width = video.videoWidth;
  clearedCanvasElement.height = video.videoHeight;

  drawingCanvasElement.style.width = video.videoWidth.toString();
  drawingCanvasElement.style.height = video.videoHeight.toString();
  drawingCanvasElement.width = video.videoWidth;
  drawingCanvasElement.height = video.videoHeight;

  WIDTH = video.videoWidth;
  HEIGHT = video.videoHeight;

  menu = new Menu(0, 0, WIDTH, 75);
  menu.addWidget(new ColorSelector("red"));
  menu.addWidget(new ColorSelector("blue"));
  menu.addWidget(new ColorSelector("green"));
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

const rightGestureDetector = new ClickDetector("Right");
rightGestureDetector.onClick = (x, y) => {
  menu.handleClick(drawingCtx, x, y);
  drawingCtx.beginPath();
  drawingCtx.rect(x, y, 10, 10);
  drawingCtx.fill();
};

async function loop() {
  if (!cameraReady) {
    requestAnimationFrame(loop);
    return;
  }
  clearedCtx.clearRect(0, 0, WIDTH, HEIGHT);

  let startTimeMs = performance.now();
  const hands = handModel.detectForVideo(video, startTimeMs);
  transformToCanvasCoords(hands, WIDTH, HEIGHT);

  if (debug) {
    clearedCtx.save();
    vis.setHands(hands);
    vis.drawConnections();
    vis.drawPoints();
    vis.drawFingerLines();
    clearedCtx.restore();
  }

  rightGestureDetector.update(hands);

  const [drawing, vector] = is_draw_gesture(hands, "Right");
  if (drawing) {
    drawingCtx.beginPath();
    drawingCtx.arc(vector.x, vector.y, 5, 0, 2 * Math.PI);
    drawingCtx.fill();
  }

  menu.draw(clearedCtx);
  requestAnimationFrame(loop);
}

document.addEventListener("DOMContentLoaded", main);
