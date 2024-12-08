import { Vector } from "./vector";

function closestPointOnLine(
  point: Vector,
  lineStart: Vector,
  lineEnd: Vector
): Vector {
  const line = lineEnd.sub(lineStart);
  const pointToLineStart = point.sub(lineStart);
  const t = pointToLineStart.dot(line) / line.dot(line);
  return lineStart.add(line.mul(t));
}

interface ClosestVertexReturn {
  index: number;
  distance: number;
}

class Polygon {
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
      ctx.globalAlpha = 0.5;
    }

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
    for (let i = 1; i < this.vertices.length; i++) {
      ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 1;

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

    if (distance < 50) {
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

    if (closestDistance < 50) {
      this.vertices.splice(closestIndex + 1, 0, clickPosition);
    }
  }

  removeVertex(clickPosition: Vector) {
    if (!this.isEditing) {
      return;
    }
    const { index, distance } = this.closestVertexIndex(clickPosition);

    if (distance < 50) {
      this.vertices.splice(index, 1);
    }
  }
}

export { Polygon };
