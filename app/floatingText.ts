class TextParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  text: string;
  life: number;
  gravity: number;
  color = "white";

  constructor(
    x: number,
    y: number,
    vx: number,
    vy: number,
    text: string,
    color: string,
    size: number,
    life: number,
    gravity: number = 0.5
  ) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.size = size;
    this.text = text;
    this.life = life;
    this.color = color;
    this.gravity = gravity;
  }

  update(): boolean {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.size += 2;
    this.life -= 1;

    return this.life <= 0;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.globalAlpha = this.opacity;
    ctx.font = `${this.size}px Arial`;
    ctx.fillStyle = this.color;
    const width = ctx.measureText(this.text).width;
    ctx.fillText(this.text, this.x - width / 2, this.y);
    ctx.globalAlpha = 1;
  }
}

export default TextParticle;
