import { DIAG, HEIGHT, WIDTH } from "./app";
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
  similarity(other: Shape): number;
  moveToPadded(minX: number, minY: number, maxX: number, maxY: number): void;
  getCenter(): Vector;
}

class Circle implements Shape {
  isEditing: boolean = false;
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

  getCenter(): Vector {
    return this.center;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.center.x, this.center.y, this.radius, 0, 2 * Math.PI);
    ctx.fill();

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

  moveToPadded(minX: number, minY: number, maxX: number, maxY: number): void {
    if (this.center.x - this.radius < minX) {
      this.center.x = minX + this.radius;
    }
    if (this.center.x + this.radius > maxX) {
      this.center.x = maxX - this.radius;
    }
    if (this.center.y - this.radius < minY) {
      this.center.y = minY + this.radius;
    }
    if (this.center.y + this.radius > maxY) {
      this.center.y = maxY - this.radius;
    }
  }

  similarity(other: Shape): number {
    if (!(other instanceof Circle)) {
      return 0;
    }

    // 100 if the radii are the same
    // less if they are different
    // proportional to the difference in radii
    // smaller diff -> higher similarity
    const r1 = this.radius;
    const r2 = other.radius;

    const similarity = (2 * r1 * r2) / (r1 * r1 + r2 * r2);
    return similarity;

    // const distance = this.center.distanceTo(other.center);
    // const radii = this.radius + other.radius;

    // if (distance > radii) {
    //   return 0;
    // }

    // if (distance < Math.abs(this.radius - other.radius)) {
    //   const smaller = Math.min(this.radius, other.radius);
    //   const larger = Math.max(this.radius, other.radius);
    //   return (Math.PI * smaller * smaller) / (Math.PI * larger * larger);
    // }
    // const r1 = this.radius;
    // const r2 = other.radius;
    // const alpha =
    //   Math.acos(
    //     (r1 * r1 + distance * distance - r2 * r2) / (2 * r1 * distance)
    //   ) * 2;
    // const beta =
    //   Math.acos(
    //     (r2 * r2 + distance * distance - r1 * r1) / (2 * r2 * distance)
    //   ) * 2;

    // const a1 = 0.5 * beta * r2 * r2 - 0.5 * r2 * r2 * Math.sin(beta);
    // const a2 = 0.5 * alpha * r1 * r1 - 0.5 * r1 * r1 * Math.sin(alpha);
    // const intersectionArea = a1 + a2;

    // return (
    //   intersectionArea /
    //   (Math.PI * r1 * r1 + Math.PI * r2 * r2 - intersectionArea)
    // );
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
  isEditing = false;
  color = "black";

  constructor(vertices: Vector[]) {
    this.vertices = vertices;
  }

  move(distance: Vector) {
    this.vertices = this.vertices.map((vertex) => vertex.add(distance));
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
    for (let i = 1; i < this.vertices.length; i++) {
      ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
    }
    ctx.closePath();
    ctx.fill();

    // for (let i = 0; i < this.vertices.length; i++) {
    //   // Text to show the index of the vertex
    //   ctx.fillStyle = "red";
    //   ctx.font = "20px Arial";
    //   ctx.fillText(i.toString(), this.vertices[i].x, this.vertices[i].y);
    // }

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

  getCenter(): Vector {
    return this.vertices
      .reduce((acc, vertex) => acc.add(vertex), new Vector(0, 0))
      .mul(1 / this.vertices.length);
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

    if (distance < DIAG * 0.05) {
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

  similarity(target: Shape): number {
    if (!(target instanceof Polygon)) {
      return 0;
    }

    const numVertices = this.vertices.length;
    const otherNumVertices = target.vertices.length;

    if (numVertices !== otherNumVertices) {
      return 0;
    }

    // translate both to 0,0
    const thisCenter = this.getCenter();
    const targetCenter = target.getCenter();
    const thisTranslated = this.vertices.map((vertex) =>
      vertex.sub(thisCenter)
    );
    const targetTranslated = target.vertices.map((vertex) =>
      vertex.sub(targetCenter)
    );

    let otherStartVertexIndex: number = 0;
    let closestDistance = Infinity;
    for (let i = 0; i < otherNumVertices; i++) {
      const distance = thisTranslated[0].distanceTo(targetTranslated[i]);
      if (distance < closestDistance) {
        closestDistance = distance;
        otherStartVertexIndex = i;
      }
    }

    let error1 = 0;
    for (let i = 0; i < numVertices; i++) {
      const thisVertex = thisTranslated[i];
      const otherVertex =
        targetTranslated[(i + otherStartVertexIndex) % numVertices];
      const dist = thisVertex.distanceTo(otherVertex);
      error1 += dist;
    }

    let error2 = 0;
    for (let i = 0; i < numVertices; i++) {
      const thisVertex = thisTranslated[i];
      const otherVertex =
        targetTranslated[
          (numVertices - i + otherStartVertexIndex) % numVertices
        ];
      const dist = thisVertex.distanceTo(otherVertex);
      error2 += dist;
    }

    const error = Math.min(error1, error2);

    const k = 2 * Math.sqrt(Math.sqrt(WIDTH * WIDTH + HEIGHT * HEIGHT));
    return 100 / (1 + Math.exp(0.1 * (error - k)));
  }

  rotate(angle: number) {
    const center = this.vertices
      .reduce((acc, vertex) => acc.add(vertex), new Vector(0, 0))
      .mul(1 / this.vertices.length);

    this.vertices = this.vertices.map((vertex) =>
      vertex.rotateAround(center, angle)
    );
  }

  getBBbox(): [number, number, number, number] {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (let vertex of this.vertices) {
      if (vertex.x < minX) {
        minX = vertex.x;
      }
      if (vertex.x > maxX) {
        maxX = vertex.x;
      }
      if (vertex.y < minY) {
        minY = vertex.y;
      }
      if (vertex.y > maxY) {
        maxY = vertex.y;
      }
    }

    return [minX, minY, maxX, maxY];
  }

  moveToPadded(minX: number, minY: number, maxX: number, maxY: number): void {
    // move entire shape so that it fits within the bounding box
    const boundingBox = this.getBBbox();

    if (boundingBox[0] < minX) {
      this.move(new Vector(minX - boundingBox[0], 0));
    }
    if (boundingBox[1] < minY) {
      this.move(new Vector(0, minY - boundingBox[1]));
    }
    if (boundingBox[2] > maxX) {
      this.move(new Vector(maxX - boundingBox[2], 0));
    }
    if (boundingBox[3] > maxY) {
      this.move(new Vector(0, maxY - boundingBox[3]));
    }
  }
}

export { Polygon, Circle, Shape };
