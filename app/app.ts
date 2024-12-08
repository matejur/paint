import { HandLandmarker } from "@mediapipe/tasks-vision";
import {
  createHandModel,
  getLandmarksByName,
  transformToCanvasCoords,
} from "./handModel";
import { Visualizer } from "./vis";
import { detectFingers, detectShape, ClickDetector } from "./gestureDetector";
import { ColorSelector, Menu } from "./menuItems";
import { DrawingController } from "./drawing";

const video = document.getElementById("webcam") as HTMLVideoElement;
const canvasElement = document.getElementById("canvas") as HTMLCanvasElement;

const ctx = canvasElement.getContext("2d");

const vis = new Visualizer(ctx);

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
  canvasElement.style.width = video.videoWidth.toString();
  canvasElement.style.height = video.videoHeight.toString();
  canvasElement.width = video.videoWidth;
  canvasElement.height = video.videoHeight;

  WIDTH = video.videoWidth;
  HEIGHT = video.videoHeight;

  menu = new Menu(0, 0, WIDTH, 75);
  const colorSection = menu.createSubsection();
  colorSection.addWidget(new ColorSelector("red"));
  colorSection.addWidget(new ColorSelector("blue"));
  colorSection.addWidget(new ColorSelector("green"));

  const utilsSection = menu.createSubsection();
  // utilsSection.addWidget({
  //   applyToCtx: (ctx: CanvasRenderingContext2D) => {
  //     ctx.clearRect(0, 0, WIDTH, HEIGHT);
  //   },
  //   draw: (
  //     ctx: CanvasRenderingContext2D,
  //     x: number,
  //     y: number,
  //     width: number,
  //     height: number
  //   ) => {
  //     ctx.beginPath();
  //     ctx.rect(x, y, width, height);
  //     ctx.fillStyle = "rgba(0, 0, 0, 0.50)";
  //     ctx.fill();
  //   },
  //   selected: false,
  // });
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

const drawingController = new DrawingController(ctx);
const rightClickDetector = new ClickDetector("Right");
const leftClickDetector = new ClickDetector("Left");
rightClickDetector.onClick = (pos) => {
  console.log("right click");
  menu.handleClick(drawingController, pos);
  drawingController.handleRightClick(pos);
};
leftClickDetector.onClick = (pos) => {
  drawingController.handleLeftClick(pos);
};

async function loop() {
  if (!cameraReady) {
    requestAnimationFrame(loop);
    return;
  }
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  let startTimeMs = performance.now();
  const hands = handModel.detectForVideo(video, startTimeMs);
  transformToCanvasCoords(hands, WIDTH, HEIGHT);

  if (debug) {
    ctx.save();
    vis.setHands(hands);
    vis.drawConnections();
    vis.drawPoints();
    vis.drawFingerLines();
    ctx.restore();
  }

  rightClickDetector.update(hands);
  leftClickDetector.update(hands);

  drawingController.update(hands);
  menu.draw(ctx);
  requestAnimationFrame(loop);
}

document.addEventListener("DOMContentLoaded", main);
