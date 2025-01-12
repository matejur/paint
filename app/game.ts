import TextParticle from "./floatingText";
import { Circle, Polygon, Shape } from "./geometry";
import { Vector } from "./vector";

function getTextAndColor(score: number) {
  if (score < 50) {
    return ["Try again!", "red"];
  } else if (score < 70) {
    return ["Good job!", "orange"];
  } else if (score < 85) {
    return ["Great job!", "yellow"];
  } else if (score < 99) {
    return ["Excellent!", "green"];
  } else {
    return ["Perfect!", "blue"];
  }
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

function randomCircle(cx: number, cy: number): Circle {
  const radius = Math.random() * 50 + 75;
  return new Circle(new Vector(cx, cy), radius);
}

function randomTriangle(cx: number, cy: number): Polygon {
  const radius = Math.random() * 50 + 75;

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
  } while (diff1 < Math.PI / 2 || diff2 < Math.PI / 2 || diff3 < Math.PI / 2);

  return new Polygon([
    new Vector(
      radius * Math.cos(angles[0]) + cx,
      radius * Math.sin(angles[0]) + cy
    ),
    new Vector(
      radius * Math.cos(angles[1]) + cx,
      radius * Math.sin(angles[1]) + cy
    ),
    new Vector(
      radius * Math.cos(angles[2]) + cx,
      radius * Math.sin(angles[2]) + cy
    ),
  ]);
}

function randomRectangle(cx: number, cy: number): Polygon {
  // Rectangle
  const width = Math.random() * 50 + 75;
  const height = Math.random() * 50 + 75;
  const poly = new Polygon([
    new Vector(cx - width / 2, cy - height / 2),
    new Vector(cx + width / 2, cy - height / 2),
    new Vector(cx + width / 2, cy + height / 2),
    new Vector(cx - width / 2, cy + height / 2),
  ]);

  poly.rotate(Math.random() * Math.PI);
  return poly;
}

function randomPoly(cx: number, cy: number): Polygon {
  const numVertices = Math.floor(Math.random() * 3) + 5;
  const vertices: Vector[] = [];
  for (let i = 0; i < numVertices; i++) {
    const angle = (i / numVertices) * Math.PI * 2;
    const distance = Math.random() * 100 + 50;
    vertices.push(
      new Vector(
        distance * Math.cos(angle) + cx,
        distance * Math.sin(angle) + cy
      )
    );
  }

  return new Polygon(vertices);
}

class Game {
  private color: string;

  private shape: Shape;

  private height: number;
  private width: number;

  private colorDifficulty: "EASY" | "MEDIUM" | "HARD";
  private shapeDifficulty: "EASY" | "MEDIUM" | "HARD";

  private texts: TextParticle[] = [];

  constructor() {
    this.colorDifficulty = "HARD";
    this.shapeDifficulty = "HARD";
  }

  getColorDifficultyText(): string {
    return this.colorDifficulty;
  }

  getShapeDifficultyText(): string {
    return this.shapeDifficulty;
  }

  setWidth(width: number) {
    this.width = width;
  }

  setHeight(height: number) {
    this.height = height;
  }

  setRandomColor() {
    const colorSkew = 0.5;
    const c1 = Math.floor(Math.pow(Math.random(), colorSkew) * 256);
    const c2 = Math.floor(Math.pow(Math.random(), colorSkew) * 256);
    const c3 = Math.floor(Math.pow(Math.random(), colorSkew) * 256);

    // 3 is the default case
    let r = c1;
    let g = c2;
    let b = c3;

    switch (this.colorDifficulty) {
      case "EASY":
        const c = Math.floor(Math.random() * 3);
        console.log(c);
        r = c === 0 ? c1 : 0;
        g = c === 1 ? c2 : 0;
        b = c === 2 ? c3 : 0;
        break;
      case "MEDIUM":
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
    // circle -> triangle or rectangle -> random convex polygon
    const shapeCX = Math.random() * this.width;
    const shapeCY = Math.random() * this.height;

    switch (this.shapeDifficulty) {
      case "EASY": // Circle
        this.shape = randomCircle(shapeCX, shapeCY);
        break;
      case "MEDIUM": // Triangle or rectangle
        if (Math.random() < 0.5) {
          this.shape = randomTriangle(shapeCX, shapeCY);
        } else {
          this.shape = randomRectangle(shapeCX, shapeCY);
        }
        break;

      case "HARD": // Random convex polygon
        this.shape = randomPoly(shapeCX, shapeCY);
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

    return Math.max(103 - deltaE, 0);
  }

  checkShape(other: Shape) {
    if (other.constructor.name != this.shape.constructor.name) {
      console.log("Wrong shape TODO");
      return;
    }

    const colorMatch = this.compareColor(other.color);
    const similarity = this.shape.similarity(other);
    const score = Math.floor((colorMatch + similarity) / 2);
    console.log("Color match:", colorMatch);
    console.log("Similarity: ", similarity);
    console.log("Score: ", score);

    const [text, color] = getTextAndColor(score);
    const particle = new TextParticle(
      other.getCenter().x,
      other.getCenter().y,
      -2 + Math.random() * (2 - -2 + 1),
      -10,
      text,
      color,
      30,
      100
    );

    this.texts.push(particle);
  }

  nextShape() {
    this.setRandomColor();
    this.setRandomShape();
  }

  drawShape(ctx: CanvasRenderingContext2D) {
    if (this.shape) {
      this.shape.draw(ctx);
    }
  }

  drawText(ctx: CanvasRenderingContext2D) {
    for (let i = 0; i < this.texts.length; i++) {
      if (this.texts[i].update()) {
        this.texts.splice(i, 1);
        i--;
      }
    }

    for (const text of this.texts) {
      text.draw(ctx);
    }
  }
}

export default Game;
