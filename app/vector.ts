class Vector {
  constructor(public x: number, public y: number) {
    this.x = x;
    this.y = y;
  }

  angleTo(vector: Vector): number {
    return (
      Math.acos(this.dot(vector) / (this.magnitude() * vector.magnitude())) *
      (180 / Math.PI)
    );
  }

  angle(): number {
    return Math.atan2(this.y, this.x) * (180 / Math.PI);
  }

  add(vector: Vector): Vector {
    return new Vector(this.x + vector.x, this.y + vector.y);
  }

  addInPlace(vector: Vector): void {
    this.x += vector.x;
    this.y += vector.y;
  }

  mul(scalar: number): Vector {
    return new Vector(this.x * scalar, this.y * scalar);
  }

  normalize(): Vector {
    const magnitude = this.magnitude();
    return new Vector(this.x / magnitude, this.y / magnitude);
  }

  sub(vector: Vector): Vector {
    return new Vector(this.x - vector.x, this.y - vector.y);
  }

  dot(vector: Vector): number {
    return this.x * vector.x + this.y * vector.y;
  }

  magnitude(): number {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }

  distanceTo(vector: Vector): number {
    return Math.sqrt((this.x - vector.x) ** 2 + (this.y - vector.y) ** 2);
  }

  rotateAround(center: Vector, angle: number): Vector {
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    const x = this.x - center.x;
    const y = this.y - center.y;
    return new Vector(
      x * cos - y * sin + center.x,
      x * sin + y * cos + center.y
    );
  }
}

export { Vector };
