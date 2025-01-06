import { Circle, Polygon, Shape } from "./geometry";
import { Vector } from "./vector";

function deltaToMessage(delta: number): string {
  if (delta < 10) {
    return "Perfect!";
  }
  if (delta < 20) {
    return "Excelent!";
  }
  if (delta < 30) {
    return "Good!";
  }
  if (delta < 40) {
    return "Could be better!";
  }

  return "Not even close!";
}

function unpackColor(color: string): [number, number, number] {
  const rgb = color.slice(4, -1).split(", ");
  return rgb.map((x) => parseInt(x)) as [number, number, number];
}

function rgbToXyz(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  const x = (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) * 100;
  const y = (r * 0.2126729 + g * 0.7151522 + b * 0.072175) * 100;
  const z = (r * 0.0193339 + g * 0.119192 + b * 0.9503041) * 100;

  return [x, y, z];
}

function xyzToLab(x: number, y: number, z: number): [number, number, number] {
  x /= 95.047;
  y /= 100;
  z /= 108.883;

  x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
  y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
  z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;

  const l = 116 * y - 16;
  const a = 500 * (x - y);
  const b = 200 * (y - z);

  return [l, a, b];
}

function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  const [x, y, z] = rgbToXyz(r, g, b);
  return xyzToLab(x, y, z);
}

class Game {
  private color: string;

  private shape: Shape;

  private height: number;
  private width: number;

  setWidth(width: number) {
    this.width = width;
  }

  setHeight(height: number) {
    this.height = height;
  }

  setRandomColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    this.color = `rgb(${r}, ${g}, ${b})`;
  }

  compareColor(color: string): number {
    const [l, a, b] = rgbToLab(...unpackColor(color));
    const [l2, a2, b2] = rgbToLab(...unpackColor(this.color));

    console.log(this.color, color);
    const deltaE = Math.sqrt(
      Math.pow(l - l2, 2) + Math.pow(a - a2, 2) + Math.pow(b - b2, 2)
    );

    return deltaE;
  }

  checkShape(other: Shape) {
    if (other.constructor.name != this.shape.constructor.name) {
      console.log("Wrong shape TODO");
      return;
    }

    const colorMatch = this.compareColor(other.color);
    console.log("Color match:", colorMatch);
    console.log("Similarity: ", this.shape.similarity(other));
  }

  nextShape() {
    this.setRandomColor();
    const x = Math.random() * this.width;
    const y = Math.random() * this.height;
    // const radius = Math.random() * 25 + 50;

    // const shape = new Circle(new Vector(x, y), radius);
    const width = Math.random() * 50 + 150;
    const height = Math.random() * 50 + 150;
    const shape = new Polygon([
      new Vector(x, y),
      new Vector(x + width, y),
      new Vector(x + width, y + height),
      new Vector(x, y + height),
    ]);
    shape.color = this.color;
    this.shape = shape;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.shape) {
      return;
    }

    this.shape.draw(ctx);
  }
}

export default Game;
