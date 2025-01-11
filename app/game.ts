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

  private colorDifficulty: number;
  private shapeDifficulty: number;

  constructor() {
    this.colorDifficulty = 1;
    this.shapeDifficulty = 4;
  }

  setWidth(width: number) {
    this.width = width;
  }

  setHeight(height: number) {
    this.height = height;
  }

  setRandomColor() {
    const c1 = Math.floor(Math.pow(Math.random(), 0.75) * 256);
    const c2 = Math.floor(Math.pow(Math.random(), 0.75) * 256);
    const c3 = Math.floor(Math.pow(Math.random(), 0.75) * 256);

    // 3 is the default case
    let r = c1;
    let g = c2;
    let b = c3;

    switch (this.colorDifficulty) {
      case 1:
        const c = Math.floor(Math.random() * 3);
        console.log(c);
        r = c === 0 ? c1 : 0;
        g = c === 1 ? c2 : 0;
        b = c === 2 ? c3 : 0;
        break;
      case 2:
        const combinations = [
          [c1, c2, 0],
          [c1, 0, c3],
          [0, c2, c3],
        ];
        [r, g, b] = combinations[Math.floor(Math.random() * 3)];
        break;
    }

    this.color = `rgb(${r}, ${g}, ${b})`;
  }

  setRandomShape() {
    // circle -> triangle -> rectangle -> random convex polygon
    const shapeCX = Math.random() * this.width;
    const shapeCY = Math.random() * this.height;
    let radius = 0;

    switch (this.shapeDifficulty) {
      case 1: // Circle
        radius = Math.random() * 50 + 75;
        this.shape = new Circle(new Vector(shapeCX, shapeCY), radius);
        break;
      case 2: // Triangle
        radius = Math.random() * 50 + 75;
        // reverse sorted angles
        let angles: number[] = [0, 0, 0];
        let diff1: number, diff2: number, diff3: number;

        do {
          angles = [
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
          ].sort((a, b) => a - b);

          diff1 = angles[1] - angles[0];
          diff2 = angles[2] - angles[1];
          diff3 = Math.PI * 2 - angles[2] + angles[0];
        } while (
          diff1 < Math.PI / 2 ||
          diff2 < Math.PI / 2 ||
          diff3 < Math.PI / 2
        );

        this.shape = new Polygon([
          new Vector(
            radius * Math.cos(angles[0]) + shapeCX,
            radius * Math.sin(angles[0]) + shapeCY
          ),
          new Vector(
            radius * Math.cos(angles[1]) + shapeCX,
            radius * Math.sin(angles[1]) + shapeCY
          ),
          new Vector(
            radius * Math.cos(angles[2]) + shapeCX,
            radius * Math.sin(angles[2]) + shapeCY
          ),
        ]);
        break;
      case 3: // Rectangle
        const width = Math.random() * 50 + 75;
        const height = Math.random() * 50 + 75;
        const poly = new Polygon([
          new Vector(shapeCX - width / 2, shapeCY - height / 2),
          new Vector(shapeCX + width / 2, shapeCY - height / 2),
          new Vector(shapeCX + width / 2, shapeCY + height / 2),
          new Vector(shapeCX - width / 2, shapeCY + height / 2),
        ]);

        poly.rotate(Math.random() * Math.PI);

        this.shape = poly;
        break;

      case 4: // Random convex polygon
        const numVertices = Math.floor(Math.random() * 3) + 5;
        const vertices: Vector[] = [];
        for (let i = 0; i < numVertices; i++) {
          const angle = (i / numVertices) * Math.PI * 2;
          const distance = Math.random() * 50 + 75;
          vertices.push(
            new Vector(
              distance * Math.cos(angle) + shapeCX,
              distance * Math.sin(angle) + shapeCY
            )
          );
        }

        this.shape = new Polygon(vertices);
        break;
    }

    const paddingX = this.width / 10;
    const paddingY = this.height / 10;
    const menuPadding = 75;

    this.shape.moveToPadded(
      paddingX,
      paddingY + menuPadding,
      this.width - paddingX,
      this.height - paddingY
    );
    this.shape.color = this.color;
  }

  compareColor(color: string): number {
    const [l, a, b] = rgbToLab(...unpackColor(color));
    const [l2, a2, b2] = rgbToLab(...unpackColor(this.color));

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

  nextShape(ctx: CanvasRenderingContext2D) {
    this.setRandomColor();
    this.setRandomShape();
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.shape) {
      return;
    }

    this.shape.draw(ctx);
  }
}

export default Game;
