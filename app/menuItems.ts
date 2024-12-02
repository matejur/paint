class Menu {
  x: number;
  y: number;
  width: number;
  height: number;

  subsections: Subsection[] = [];

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  createSubsection() {
    const totalSubsections = this.subsections.length + 1;
    const width = this.width / totalSubsections;
    const x = this.x + width * this.subsections.length;

    for (let i = 0; i < this.subsections.length; i++) {
      const subsection = this.subsections[i];
      subsection.width = width;
      subsection.x = this.x + width * i;
    }

    const subsection = new Subsection(x, this.y, width, this.height);
    this.subsections.push(subsection);
    return subsection;
  }

  handleClick(ctx: CanvasRenderingContext2D, x: number, y: number) {
    for (let subsection of this.subsections) {
      subsection.handleClick(ctx, x, y);
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (let subsection of this.subsections) {
      subsection.draw(ctx);
    }
  }
}

class Subsection {
  x: number;
  y: number;
  width: number;
  height: number;

  padding: number = 10;

  widgets: Widget[] = [];

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  addWidget(widget: Widget) {
    this.widgets.push(widget);
  }

  handleClick(ctx: CanvasRenderingContext2D, x: number, y: number) {
    if (
      x < this.x ||
      x > this.x + this.width ||
      y < this.y ||
      y > this.y + this.height
    ) {
      return;
    }

    let currentX = this.x + this.padding;
    const currentY = this.y + this.padding;
    const widget_size = this.height - 2 * this.padding;

    for (let widget of this.widgets) {
      if (
        x > currentX &&
        x < currentX + widget_size &&
        y > currentY &&
        y < currentY + widget_size
      ) {
        widget.selected = true;
        widget.applyToCtx(ctx);
      } else {
        widget.selected = false;
      }
      currentX += widget_size + this.padding;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.rect(this.x, this.y, this.width, this.height);
    ctx.fill();

    let currentX = this.x + this.padding;
    const currentY = this.y + this.padding;
    const widget_size = this.height - 2 * this.padding;

    for (let widget of this.widgets) {
      if (widget.selected) {
        ctx.beginPath();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 5;
        ctx.rect(currentX, currentY, widget_size, widget_size);
        ctx.stroke();
      }
      widget.draw(ctx, currentX, currentY, widget_size, widget_size);
      currentX += widget_size + this.padding;
    }
  }
}

interface Widget {
  selected: boolean;
  draw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ): void;
  applyToCtx(ctx: CanvasRenderingContext2D): void;
}

class ColorSelector implements Widget {
  selected: boolean = false;
  color: string;

  constructor(color: string) {
    this.color = color;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.rect(x, y, width, height);
    ctx.fill();
  }

  applyToCtx(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.color;
  }
}

class SizeSelector implements Widget {
  selected: boolean = false;
  size: number;

  constructor(size: number) {
    this.size = size;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    ctx.beginPath();
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "30px Arial";
    ctx.fillText(this.size.toString(), x + width / 2, y + height / 2);
    ctx.fill();
  }

  applyToCtx(ctx: CanvasRenderingContext2D): void {
    ctx.lineWidth = this.size;
  }
}

export { Menu, Widget, ColorSelector, SizeSelector };
