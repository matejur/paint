import { HandLandmarker } from "@mediapipe/tasks-vision";
import {
  createHandModel,
  getLandmarksByName,
  transformToCanvasCoords,
} from "./handModel";
import { Visualizer } from "./vis";
import { detectFingers, detectShape, ClickDetector } from "./gestureDetector";
import { ColorSelector, Menu, SizeSelector } from "./menuItems";
import { DrawingController } from "./drawing";

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
let debug = false;

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
  const colorSection = menu.createSubsection();
  colorSection.addWidget(new ColorSelector("red"));
  colorSection.addWidget(new ColorSelector("blue"));
  colorSection.addWidget(new ColorSelector("green"));

  const sizeSection = menu.createSubsection();
  sizeSection.addWidget(new SizeSelector(5));
  sizeSection.addWidget(new SizeSelector(10));
  sizeSection.addWidget(new SizeSelector(15));

  const utilsSection = menu.createSubsection();
  utilsSection.addWidget({
    applyToCtx: (ctx: CanvasRenderingContext2D) => {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
    },
    draw: (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      width: number,
      height: number
    ) => {
      ctx.beginPath();
      ctx.rect(x, y, width, height);
      ctx.fillStyle = "rgba(0, 0, 0, 0.50)";
      ctx.fill();
    },
    selected: false,
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

window.addEventListener("keydown", (e) => {
  if (e.key === "d") {
    debug = !debug;
  }
});

const drawingController = new DrawingController(drawingCtx, clearedCtx);
const rightGestureDetector = new ClickDetector("Right");
rightGestureDetector.onClick = (x, y) => {
  menu.handleClick(drawingCtx, x, y);
  drawingController.handleClick(x, y);
  if (debug) {
    drawingCtx.beginPath();
    drawingCtx.rect(x, y, 10, 10);
    drawingCtx.fill();
  }
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

  drawingController.update(hands);
  menu.draw(clearedCtx);
  requestAnimationFrame(loop);
}

document.addEventListener("DOMContentLoaded", main);
