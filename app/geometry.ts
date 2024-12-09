import { Vector } from "./vector";

function closestPointOnLine(
  point: Vector,
  lineStart: Vector,
  lineEnd: Vector
): Vector {
  const line = lineEnd.sub(lineStart);
  const pointToLineStart = point.sub(lineStart);
  const t = pointToLineStart.dot(line) / line.dot(line);
  if (t < 0) {
    return lineStart;
  }
  if (t > 1) {
    return lineEnd;
  }
  return lineStart.add(line.mul(t));
}

interface ClosestVertexReturn {
  index: number;
  distance: number;
}

interface Shape {
  color: string;
  isEditing: boolean;
  draw(ctx: CanvasRenderingContext2D): void;
  isPointInside(point: Vector): boolean;
  move(distance: Vector): void;
  addVertex(clickPosition: Vector): void;
  removeVertex(clickPosition: Vector): void;
  moveClosestVertex(position: Vector): void;
  changeRadius(previous: Vector, current: Vector): void;
}

class Circle implements Shape {
  isEditing: boolean = true;
  center: Vector;
  radius: number;
  color = "black";

  constructor(center: Vector, radius: number) {
    this.center = center;
    this.radius = radius;
  }

  move(distance: Vector) {
    this.center = this.center.add(distance);
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.isEditing) {
      ctx.globalAlpha = 0.4;
    }

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.center.x, this.center.y, this.radius, 0, 2 * Math.PI);
    ctx.fill();

    ctx.globalAlpha = 0.95;
    if (this.isEditing) {
      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.moveTo(this.center.x, this.center.y);
      ctx.lineTo(this.center.x + this.radius, this.center.y);
      ctx.strokeStyle = "red";
      ctx.lineWidth = 4;
      ctx.stroke();
    }
  }

  isPointInside(point: Vector): boolean {
    return this.center.distanceTo(point) < this.radius;
  }

  moveClosestVertex(position: Vector) {}

  addVertex(clickPosition: Vector) {}

  removeVertex(clickPosition: Vector) {}

  changeRadius(previous: Vector, current: Vector): void {
    const previousDistance = this.center.distanceTo(previous);
    const currentDistance = this.center.distanceTo(current);

    this.radius += currentDistance - previousDistance;
    if (this.radius < 5) {
      this.radius = 5;
    }
  }
}

class Polygon implements Shape {
  vertices: Vector[] = [];
  isEditing = true;
  color = "black";

  constructor(vertices: Vector[]) {
    this.vertices = vertices;
  }

  move(distance: Vector) {
    this.vertices = this.vertices.map((vertex) => vertex.add(distance));
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.isEditing) {
      ctx.globalAlpha = 0.4;
    }

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
    for (let i = 1; i < this.vertices.length; i++) {
      ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 0.95;

    if (!this.isEditing) {
      return;
    }

    ctx.fillStyle = "red";
    for (let i = 0; i < this.vertices.length; i++) {
      ctx.beginPath();
      ctx.arc(this.vertices[i].x, this.vertices[i].y, 5, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  isPointInside(point: Vector): boolean {
    let isInside = false;
    for (
      let i = 0, j = this.vertices.length - 1;
      i < this.vertices.length;
      j = i++
    ) {
      const start = this.vertices[i];
      const end = this.vertices[j];
      if (
        start.y > point.y !== end.y > point.y &&
        point.x <
          ((end.x - start.x) * (point.y - start.y)) / (end.y - start.y) +
            start.x
      ) {
        isInside = !isInside;
      }
    }
    return isInside;
  }

  closestVertexIndex(position: Vector): ClosestVertexReturn {
    let closestDistance = Infinity;
    let closestIndex = 0;

    for (let i = 0; i < this.vertices.length; i++) {
      const distance = this.vertices[i].distanceTo(position);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = i;
      }
    }

    return { index: closestIndex, distance: closestDistance };
  }

  moveClosestVertex(position: Vector) {
    if (!this.isEditing) {
      return;
    }

    const { index, distance } = this.closestVertexIndex(position);

    if (distance < 100) {
      this.vertices[index] = position;
    }
  }

  addVertex(clickPosition: Vector) {
    if (!this.isEditing) {
      return;
    }

    let closestDistance = Infinity;
    let closestIndex = 0;

    for (let i = 0; i < this.vertices.length; i++) {
      const start = this.vertices[i];
      const end = this.vertices[(i + 1) % this.vertices.length];
      const closest = closestPointOnLine(clickPosition, start, end);
      const distance = closest.distanceTo(clickPosition);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = i;
      }
    }

    if (closestDistance < 100) {
      this.vertices.splice(closestIndex + 1, 0, clickPosition);
    }
  }

  removeVertex(clickPosition: Vector) {
    if (!this.isEditing) {
      return;
    }
    const { index, distance } = this.closestVertexIndex(clickPosition);

    if (distance < 100) {
      this.vertices.splice(index, 1);
    }
  }

  changeRadius(previous: Vector, current: Vector): void {}
}

export { Polygon, Circle, Shape };
