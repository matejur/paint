import { HandLandmarker } from "@mediapipe/tasks-vision";
import {
  createHandModel,
  getLandmarksByName,
  transformToCanvasCoords,
} from "./handModel";
import { Visualizer } from "./vis";
import { detectFingers, detectShape, GestureDetector } from "./gestureDetector";
import { ColorSelector, Menu } from "./menuItems";
import { DrawingController } from "./drawing";
import Game from "./game";

const video = document.getElementById("webcam") as HTMLVideoElement;
const canvasElement = document.getElementById("canvas") as HTMLCanvasElement;

let handModel: HandLandmarker;
let menu: Menu;
let cameraReady = false;
let debug = false;
let fullscreen = false;

let WIDTH = 640;
let HEIGHT = 480;

let savedWidth = WIDTH;
let savedHeight = HEIGHT;

const ctx = canvasElement.getContext("2d");

const vis = new Visualizer(ctx);

const game = new Game();
const drawingController = new DrawingController(ctx, game);
const rightGestureDetector = new GestureDetector("Right");
const leftGestureDetector = new GestureDetector("Left");
rightGestureDetector.onClick = (pos) => {
  console.log("right click");
  drawingController.handleRightClick(pos);
};
leftGestureDetector.onClick = (pos) => {
  console.log("left click");
  drawingController.handleLeftClick(pos);
};
rightGestureDetector.onDrag = (pos) => {
  if (!menu.handleDrag(pos)) {
    drawingController.handleRightDrag(pos);
  }
};
rightGestureDetector.onDragStop = () => {
  drawingController.stopRightDrag();
};
leftGestureDetector.onDrag = (pos) => {
  drawingController.handleLeftDrag(pos);
};
leftGestureDetector.onDragStop = () => {
  drawingController.stopLeftDrag();
};

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

  game.setHeight(HEIGHT);
  game.setWidth(WIDTH);

  menu = new Menu(0, 0, WIDTH, 75);
  menu.addWidget(new ColorSelector(drawingController));
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

let nextShape = false;

window.addEventListener("keydown", (e) => {
  if (e.key === "d") {
    debug = !debug;
  } else if (e.key === "f") {
    if (fullscreen) {
      WIDTH = savedWidth;
      HEIGHT = savedHeight;
    } else {
      savedWidth = WIDTH;
      savedHeight = HEIGHT;
      HEIGHT = window.innerHeight * 0.99;
    }
    const videoAspectRatio = video.videoWidth / video.videoHeight;
    WIDTH = HEIGHT * videoAspectRatio;
    canvasElement.width = WIDTH;
    canvasElement.height = HEIGHT;
    video.width = WIDTH;
    video.height = HEIGHT;

    game.setHeight(HEIGHT);
    game.setWidth(WIDTH);

    menu.setBBbox(0, 0, WIDTH, 0.1 * HEIGHT);

    fullscreen = !fullscreen;
  } else if (e.key === "n") {
    nextShape = true;
  }
});

let depthHistory = [];

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
    //vis.drawDebugLines();
    vis.drawGraph(depthHistory);
    //vis.drawFingerLines();
    ctx.restore();
  }

  const landmarks = getLandmarksByName(hands, "Right");
  if (!landmarks) {
    depthHistory = [];
  } else {
    const fingers = detectFingers(landmarks);
    depthHistory.push(fingers.index.top.depth);
    if (depthHistory.length > 100) {
      depthHistory.shift();
    }
  }

  rightGestureDetector.update(hands);
  leftGestureDetector.update(hands);

  if (nextShape) {
    game.nextShape();
    nextShape = false;
  }

  game.draw(ctx);
  drawingController.update(hands);
  menu.draw(ctx);
  requestAnimationFrame(loop);
}

document.addEventListener("DOMContentLoaded", main);

export { WIDTH, HEIGHT };
