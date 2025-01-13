import { HEIGHT, WIDTH } from "./app";
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

function progressBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  progress: number
) {
  ctx.fillStyle = "white";
  ctx.fillRect(x, y, width, height);

  ctx.fillStyle = "green";
  ctx.fillRect(x, y, width * progress, height);
}

function borderText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string = "white"
) {
  ctx.strokeStyle = "black";
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
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

  private colorPoints: number = 0;
  private shapePoints: number = 0;

  private pointsPerLevel: number = 200;

  private showColorLevelUpFrames: number = 0;
  private showShapeLevelUpFrames: number = 0;

  private texts: TextParticle[] = [];

  constructor() {
    this.colorDifficulty = "EASY";
    this.shapeDifficulty = "EASY";
  }

  getColorDifficultyText(): string {
    return this.colorDifficulty;
  }

  getShapeDifficultyText(): string {
    return this.shapeDifficulty;
  }

  getColorProgress(): number {
    return Math.min(this.colorPoints / this.pointsPerLevel, 1);
  }

  getShapeProgress(): number {
    return Math.min(this.shapePoints / this.pointsPerLevel, 1);
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

  nextDifficulty(
    current: "EASY" | "MEDIUM" | "HARD"
  ): "EASY" | "MEDIUM" | "HARD" {
    switch (current) {
      case "EASY":
        return "MEDIUM";
      case "MEDIUM":
        return "HARD";
      case "HARD":
        return "HARD";
    }
  }

  updateDifficulty(shapePoints: number, colorPoints: number) {
    this.shapePoints += shapePoints;
    this.colorPoints += colorPoints;

    if (this.shapePoints > this.pointsPerLevel) {
      this.shapePoints = 0;
      this.shapeDifficulty = this.nextDifficulty(this.shapeDifficulty);

      this.showShapeLevelUpFrames = 100;
    }

    if (this.colorPoints > this.pointsPerLevel) {
      this.colorPoints = 0;
      this.colorDifficulty = this.nextDifficulty(this.colorDifficulty);

      this.showColorLevelUpFrames = 100;
    }
  }

  checkShape(other: Shape) {
    const colorMatch = this.compareColor(other.color);
    const shapeMatch = this.shape.similarity(other);
    const score = Math.floor((colorMatch + shapeMatch) / 2);

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

    this.updateDifficulty(shapeMatch, colorMatch);

    this.nextShape();
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

    ctx.font = "40px Arial";
    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;

    const aspect = WIDTH / HEIGHT;
    const scaleX = WIDTH / 864;
    const scaleY = HEIGHT / (864 / aspect);

    ctx.save();
    ctx.scale(scaleX, scaleY);
    const maxTextWidth = ctx.measureText("Colour: MEDIUM").width;
    const progressBarWidth = WIDTH / scaleX - maxTextWidth - 50;
    borderText(
      ctx,
      "Colour: " + this.getColorDifficultyText(),
      10,
      HEIGHT / scaleY - 10
    );
    progressBar(
      ctx,
      maxTextWidth + 20,
      HEIGHT / scaleY - 40,
      progressBarWidth,
      35,
      this.getColorProgress()
    );

    borderText(
      ctx,
      "Shape: " + this.getShapeDifficultyText(),
      10,
      HEIGHT / scaleY - 50
    );

    progressBar(
      ctx,
      maxTextWidth + 20,
      HEIGHT / scaleY - 80,
      progressBarWidth,
      35,
      this.getShapeProgress()
    );

    if (this.showColorLevelUpFrames > 0) {
      let alpha = 1;

      if (this.showColorLevelUpFrames < 50) {
        alpha = this.showColorLevelUpFrames / 50;
      }

      ctx.globalAlpha = alpha;
      borderText(
        ctx,
        "Level up!",
        maxTextWidth +
          20 +
          progressBarWidth / 2 -
          ctx.measureText("Level up!").width / 2,
        HEIGHT / scaleY - 10,
        "red"
      );
      ctx.globalAlpha = 1;

      this.showColorLevelUpFrames--;
    }

    if (this.showShapeLevelUpFrames > 0) {
      let alpha = 1;

      if (this.showColorLevelUpFrames < 50) {
        alpha = this.showColorLevelUpFrames / 50;
      }

      ctx.globalAlpha = alpha;
      borderText(
        ctx,
        "Level up!",
        maxTextWidth +
          20 +
          progressBarWidth / 2 -
          ctx.measureText("Level up!").width / 2,
        HEIGHT / scaleY - 50,
        "red"
      );
      ctx.globalAlpha = 1;

      this.showShapeLevelUpFrames--;
    }
    ctx.restore();
  }
}

export default Game;
