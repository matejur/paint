import { HandLandmarkerResult } from "@mediapipe/tasks-vision";
import {
  detectShape,
  isPinching,
  isThumbsUp,
  zoomGesture,
} from "./gestureDetector";
import { Vector } from "./vector";
import { Polygon } from "./geometry";

class DrawingController {
  ctx: CanvasRenderingContext2D;
  isDrawing = false;
  eraserSize = 40;

  previousLeftPosition: Vector | null = null;
  previousRightPosition: Vector | null = null;

  allShapes: Polygon[] = [];
  currentShape: Polygon | null = null;
  isEditingShape = false;

  currentColor = "black";

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  handleRightClick(pos: Vector) {
    if (this.isEditingShape) {
      this.currentShape.addVertex(pos);
    }
  }

  handleLeftClick(pos: Vector) {
    if (this.isEditingShape) {
      this.currentShape.removeVertex(pos);
    }
  }

  setColor(color: string) {
    this.currentColor = color;
  }

  // handleDraw(drawing: boolean, position: Vector) {
  //   if (this.isPlacingShape) {
  //     return;
  //   }
  //   if (!this.isDrawing && drawing) {
  //     this.isDrawing = true;
  //     this.drawingCtx.beginPath();
  //   } else if (this.isDrawing && !drawing) {
  //     this.isDrawing = false;
  //     this.drawingCtx.closePath();
  //   }
  //   if (this.isDrawing) {
  //     if (this.previousPosition.distanceTo(position) > 10) {
  //       this.drawingCtx.lineTo(Math.round(position.x), Math.round(position.y));
  //       this.drawingCtx.stroke();
  //       this.previousPosition = position;
  //     }
  //   }
  // }

  handleShapePlacement(hands: HandLandmarkerResult) {
    if (!this.isEditingShape) {
      const shape = detectShape(hands);
      if (shape) {
        this.currentShape = shape;
        this.isEditingShape = true;
        this.allShapes.push(shape);
      }
    }
  }

  update(hands: HandLandmarkerResult) {
    const [rightPinch, rightPosition] = isPinching(hands, "Right");
    const [leftPinch, leftPosition] = isPinching(hands, "Left");
    const thumbsUp = isThumbsUp(hands, "Right");

    if (this.isEditingShape) {
      this.currentShape.color = this.currentColor;
      if (thumbsUp) {
        this.currentShape.isEditing = false;
        this.isEditingShape = false;
        this.currentShape = null;
      } else if (leftPinch && this.previousLeftPosition) {
        const movement = leftPosition.sub(this.previousLeftPosition);
        this.currentShape.move(movement);
      } else if (rightPinch && this.previousRightPosition) {
        this.currentShape.moveClosestVertex(this.previousRightPosition);
      }
    }

    for (let shape of this.allShapes) {
      shape.draw(this.ctx);
    }

    this.handleShapePlacement(hands);

    this.previousLeftPosition = leftPinch ? leftPosition : null;
    this.previousRightPosition = rightPinch ? rightPosition : null;
  }
}

export { DrawingController, Polygon };
