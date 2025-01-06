import { HandLandmarkerResult } from "@mediapipe/tasks-vision";
import {
  detectFingers,
  detectShape,
  isPinching,
  isThumbsUpOrDown,
} from "./gestureDetector";
import { Vector } from "./vector";
import { Polygon, Shape } from "./geometry";
import { getLandmarksByName } from "./handModel";
import Game from "./game";

class DrawingController {
  ctx: CanvasRenderingContext2D;
  isDrawing = false;

  previousLeftPosition: Vector | null = null;
  previousRightPosition: Vector | null = null;

  color = "black";

  allShapes: Shape[] = [];
  currentShape: Shape | null = null;
  isEditingShape = false;

  game: Game;

  constructor(ctx: CanvasRenderingContext2D, game: Game) {
    this.ctx = ctx;
    this.game = game;
  }

  handleRightClick(pos: Vector) {
    if (this.isEditingShape) {
      this.currentShape.addVertex(pos);
    } else {
      for (let shape of this.allShapes.slice().reverse()) {
        if (shape.isPointInside(pos)) {
          shape.isEditing = true;
          this.currentShape = shape;
          this.isEditingShape = true;
          break;
        }
      }
    }
  }

  handleLeftClick(pos: Vector) {
    if (this.isEditingShape) {
      this.currentShape.removeVertex(pos);
    }
  }

  setColor(color: string) {
    if (this.currentShape) {
      this.currentShape.color = color;
    }
    this.color = color;
  }

  handleShapePlacement(hands: HandLandmarkerResult) {
    if (!this.isEditingShape) {
      const shape = detectShape(hands);
      if (shape) {
        shape.color = this.color;
        shape.isEditing = true;
        this.currentShape = shape;
        this.isEditingShape = true;
        this.allShapes.push(shape);
      }
    }
  }

  handleRightDrag(pos: Vector) {
    if (this.isEditingShape) {
      if (this.previousRightPosition) {
        this.currentShape.moveClosestVertex(this.previousRightPosition);
        this.currentShape.changeRadius(this.previousRightPosition, pos);
      }
      this.previousRightPosition = pos;
    }
  }

  handleLeftDrag(pos: Vector) {
    if (this.isEditingShape) {
      if (this.previousLeftPosition) {
        const movement = pos.sub(this.previousLeftPosition);
        this.currentShape.move(movement);
      }
      this.previousLeftPosition = pos;
    }
  }

  stopLeftDrag() {
    this.previousLeftPosition = null;
  }

  stopRightDrag() {
    this.previousRightPosition = null;
  }

  update(hands: HandLandmarkerResult) {
    const rightFingers = detectFingers(getLandmarksByName(hands, "Right"));
    const leftfingers = detectFingers(getLandmarksByName(hands, "Left"));

    const [thumbUpOrDownRight, dirRight] = isThumbsUpOrDown(rightFingers);
    const [thumbUpOrDownLeft, dirLeft] = isThumbsUpOrDown(leftfingers);

    if (this.isEditingShape) {
      if (thumbUpOrDownRight && dirRight === "up") {
        this.game.checkShape(this.currentShape);
        this.currentShape.isEditing = false;
        this.isEditingShape = false;
        this.currentShape = null;
      } else if (thumbUpOrDownLeft && dirLeft === "down") {
        const index = this.allShapes.indexOf(this.currentShape);
        this.allShapes.splice(index, 1);
        this.isEditingShape = false;
        this.currentShape = null;
      }
    }

    for (let shape of this.allShapes) {
      shape.draw(this.ctx);
    }

    this.handleShapePlacement(hands);
  }
}

export { DrawingController, Polygon };
