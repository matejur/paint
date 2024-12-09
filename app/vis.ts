import { HAND_CONNECTIONS } from "@mediapipe/hands";
import { HandLandmarkerResult } from "@mediapipe/tasks-vision";
import { detectFingers } from "./gestureDetector";

class Visualizer {
  hands: HandLandmarkerResult;
  ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  setHands(hands: HandLandmarkerResult) {
    this.hands = hands;
  }

  drawPoints() {
    for (let i = 0; i < this.hands.handedness.length; i++) {
      const hand = this.hands.handedness[i][0].categoryName;
      this.hands.landmarks[i].forEach((landmark) => {
        this.ctx.beginPath();
        this.ctx.arc(landmark.x, landmark.y, 5, 0, 2 * Math.PI);
        this.ctx.fillStyle = hand === "Right" ? "red" : "blue";
        this.ctx.fill();
      });
    }
  }

  drawGraph(numbers: number[]) {
    const width = this.ctx.canvas.width;
    const height = this.ctx.canvas.height;
    const step = width / numbers.length;
    const max = 0;
    const min = -0.1;

    this.ctx.beginPath();
    this.ctx.moveTo(0, height);
    for (let i = 0; i < numbers.length; i++) {
      const x = i * step;
      const y = height - ((numbers[i] - min) / (max - min)) * height;
      this.ctx.lineTo(x, y);
    }
    this.ctx.lineTo(width, height);
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    this.ctx.fill();
  }

  drawConnections() {
    for (let i = 0; i < this.hands.handedness.length; i++) {
      const hand = this.hands.handedness[i][0].categoryName;
      HAND_CONNECTIONS.forEach((connection) => {
        const start = this.hands.landmarks[i][connection[0]];
        const end = this.hands.landmarks[i][connection[1]];
        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);
        this.ctx.strokeStyle = hand === "Right" ? "red" : "blue";
        this.ctx.lineWidth = 4;
        this.ctx.stroke();
      });
    }
  }

  drawFingerLines() {
    for (let i = 0; i < this.hands.handedness.length; i++) {
      const fingers = detectFingers(this.hands.landmarks[i]);
      Object.keys(fingers).forEach((fingerName) => {
        const finger = fingers[fingerName].top;
        const startX = 0;
        const startY = finger.intercept;
        const endX = this.ctx.canvas.width;
        const endY = finger.slope * endX + finger.intercept;

        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.strokeStyle = "green";
        this.ctx.lineWidth = 4;
        this.ctx.stroke();
      });
    }
  }

  drawDebugLines() {
    for (let i = 0; i < this.hands.handedness.length; i++) {
      const hand = this.hands.handedness[i][0].categoryName;
      const landmarks = this.hands.landmarks[i];

      const fingers = detectFingers(landmarks);
      const dist = fingers.thumb.tip.distanceTo(fingers.index.tip);
      this.ctx.beginPath();
      this.ctx.moveTo(fingers.thumb.tip.x, fingers.thumb.tip.y);
      this.ctx.lineTo(fingers.index.tip.x, fingers.index.tip.y);
      this.ctx.strokeStyle = "green";
      this.ctx.lineWidth = 4;
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.arc(
        (landmarks[6].x + landmarks[2].x) / 2,
        (landmarks[6].y + landmarks[2].y) / 2,
        dist / 2,
        0,
        2 * Math.PI
      );
      this.ctx.stroke();

      this.ctx.font = "30px Arial";
      this.ctx.fillStyle = "white";
      this.ctx.fillText(
        dist.toFixed(2),
        (fingers.index.tip.x + fingers.thumb.tip.x) / 2,
        (fingers.index.tip.y + fingers.thumb.tip.y) / 2
      );

      this.ctx.stroke();
    }
  }
}

export { Visualizer };
