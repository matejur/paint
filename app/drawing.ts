import { HandLandmarkerResult } from "@mediapipe/tasks-vision";
import { detectShape, isPinching, zoomGesture } from "./gestureDetector";
import { Vector } from "./vector";

interface Figure {
  originalCoords: Vector[];
  coords: Vector[];
  draw(ctx: CanvasRenderingContext2D): void;
  setCenter(center: Vector): void;
  setScale(tip1: Vector, tip2: Vector): void;
}

class Rectangle implements Figure {
  originalCoords: Vector[];
  coords: Vector[];

  constructor(coords: Vector[]) {
    this.coords = coords;
    this.originalCoords = coords;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.rect(
      this.coords[0].x,
      this.coords[0].y,
      this.coords[1].x - this.coords[0].x,
      this.coords[1].y - this.coords[0].y
    );
    ctx.fill();
  }

  setCenter(center: Vector): void {
    const width = this.coords[1].x - this.coords[0].x;
    const height = this.coords[1].y - this.coords[0].y;

    this.coords[0].x = center.x - width / 2;
    this.coords[0].y = center.y - height / 2;
    this.coords[1].x = center.x + width / 2;
    this.coords[1].y = center.y + height / 2;

    this.originalCoords = this.coords;
  }

  setScale(tip1: Vector, tip2: Vector): void {
    const center = new Vector(
      (this.originalCoords[0].x + this.originalCoords[1].x) / 2,
      (this.originalCoords[0].y + this.originalCoords[1].y) / 2
    );
    const width = this.originalCoords[1].x - this.originalCoords[0].x;
    const height = this.originalCoords[1].y - this.originalCoords[0].y;

    const diff = tip1.subtract(tip2);
    const newWidth = Math.abs(diff.x);
    const newHeight = Math.abs(diff.y);

    this.coords[0].x = center.x - newWidth / 2;
    this.coords[0].y = center.y - newHeight / 2;
    this.coords[1].x = center.x + newWidth / 2;
    this.coords[1].y = center.y + newHeight / 2;
  }
}

class DrawingController {
  drawingCtx: CanvasRenderingContext2D;
  clearedCtx: CanvasRenderingContext2D;
  isDrawing = false;
  eraserSize = 40;

  previousPosition: Vector = new Vector(0, 0);

  shape: Figure | null = null;
  isPlacingShape = false;

  constructor(
    drawingCtx: CanvasRenderingContext2D,
    clearedCtx: CanvasRenderingContext2D
  ) {
    this.drawingCtx = drawingCtx;
    this.clearedCtx = clearedCtx;
  }

  handleClick(x: number, y: number) {
    if (this.isPlacingShape) {
      this.isPlacingShape = false;
      this.shape.draw(this.drawingCtx);
      this.shape = null;
    }
  }

  handleDraw(drawing: boolean, position: Vector) {
    if (this.isPlacingShape) {
      return;
    }
    if (!this.isDrawing && drawing) {
      this.isDrawing = true;
      this.drawingCtx.beginPath();
    } else if (this.isDrawing && !drawing) {
      this.isDrawing = false;
      this.drawingCtx.closePath();
    }
    if (this.isDrawing) {
      if (this.previousPosition.distanceTo(position) > 10) {
        this.drawingCtx.lineTo(Math.round(position.x), Math.round(position.y));
        this.drawingCtx.stroke();
        this.previousPosition = position;
      }
    }
  }

  handleShapePlacement(hands: HandLandmarkerResult) {
    if (!this.isPlacingShape) {
      const shape = detectShape(hands);
      if (shape) {
        this.shape = shape;
        this.isPlacingShape = true;
      }
    }
    if (!this.shape) {
      return;
    }

    this.shape.draw(this.clearedCtx);
  }

  update(hands: HandLandmarkerResult) {
    const [drawing, position] = isPinching(hands, "Right");
    this.handleDraw(drawing, position);

    const [erasing, eraserPosition] = isPinching(hands, "Left");
    if (erasing) {
      this.drawingCtx.clearRect(
        eraserPosition.x - this.eraserSize / 2,
        eraserPosition.y - this.eraserSize / 2,
        this.eraserSize,
        this.eraserSize
      );
    }

    if ((!drawing && !erasing) || this.isPlacingShape) {
      this.handleShapePlacement(hands);

      if (this.shape) {
        if (drawing) {
          this.shape.setCenter(position);
        }
        const [zoom, indexTip, thumbTip] = zoomGesture(hands, "Left");
        if (zoom) {
          this.shape.setScale(indexTip, thumbTip);
        }
      }
    }
  }
}

export { DrawingController, Figure, Rectangle };
