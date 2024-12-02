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
}

export { Visualizer };
