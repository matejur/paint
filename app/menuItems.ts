import { DrawingController } from "./drawing";
import { Vector } from "./vector";

const horizontalPadding = 10;
const verticalPadding = 10;
class Menu {
  x: number;
  y: number;
  width: number;
  height: number;

  widgets: Widget[] = [];

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  setBBbox(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.recalculateWidgetPositions();
  }

  recalculateWidgetPositions() {
    const numWidgets = this.widgets.length;
    const widgetWidth =
      (this.width - horizontalPadding * (numWidgets + 1)) / numWidgets;

    let startX = this.x + horizontalPadding;
    for (let widget of this.widgets) {
      widget.setBbox(
        startX,
        this.y + verticalPadding,
        widgetWidth,
        this.height
      );
      startX += widgetWidth + horizontalPadding;
    }
  }

  addWidget(widget: Widget) {
    this.widgets.push(widget);
    this.recalculateWidgetPositions();
  }

  handleDrag(pos: Vector): boolean {
    for (let widget of this.widgets) {
      if (widget.handleDrag(pos)) {
        return true;
      }
    }
    return (
      pos.x > this.x &&
      pos.x < this.x + this.width &&
      pos.y > this.y &&
      pos.y < this.y + this.height
    );
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (let widget of this.widgets) {
      widget.draw(ctx);
    }
  }
}

interface Widget {
  controller: DrawingController;
  draw(ctx: CanvasRenderingContext2D): void;
  setBbox(x: number, y: number, width: number, height: number): void;
  updateController(): void;
  handleDrag(pos: Vector): boolean;
}

class ColorSelector implements Widget {
  controller: DrawingController;
  red_slider = new Slider();
  green_slider = new Slider();
  blue_slider = new Slider();

  x: number;
  y: number;
  width: number;
  height: number;

  constructor(controller: DrawingController) {
    this.controller = controller;
    this.red_slider.percent = 1;
    this.green_slider.percent = 1;
    this.blue_slider.percent = 1;
    this.updateController();
  }

  setBbox(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    const sliderSectionWidth = 0.9 * (this.width - horizontalPadding * 4);
    const sliderWidth = sliderSectionWidth / 3;

    this.red_slider.x = x + horizontalPadding;
    this.red_slider.y = y + verticalPadding;
    this.red_slider.width = sliderWidth;
    this.red_slider.height = height - verticalPadding * 2;

    this.green_slider.x =
      x + horizontalPadding + sliderWidth + horizontalPadding;
    this.green_slider.y = y + verticalPadding;
    this.green_slider.width = sliderWidth;
    this.green_slider.height = height - verticalPadding * 2;

    this.blue_slider.x =
      x + horizontalPadding + 2 * (sliderWidth + horizontalPadding);
    this.blue_slider.y = y + verticalPadding;
    this.blue_slider.width = sliderWidth;
    this.blue_slider.height = height - verticalPadding * 2;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.fillStyle = "rgba(0, 0, 0, 0.50)";
    ctx.rect(this.x, this.y, this.width, this.height);
    ctx.fill();

    ctx.fillStyle = `rgba(${this.red_slider.percent * 255}, 0, 0, 0.8)`;
    this.red_slider.draw(ctx);

    ctx.fillStyle = `rgba(0, ${this.green_slider.percent * 255}, 0, 0.8)`;
    this.green_slider.draw(ctx);

    ctx.fillStyle = `rgba(0, 0, ${this.blue_slider.percent * 255}, 0.8)`;
    this.blue_slider.draw(ctx);

    ctx.beginPath();
    ctx.fillStyle = `rgba(${this.red_slider.percent * 255}, ${
      this.green_slider.percent * 255
    }, ${this.blue_slider.percent * 255}, 1.0)`;
    ctx.fillRect(
      0.9 * this.width + this.x + horizontalPadding,
      this.y + verticalPadding,
      0.1 * this.width - 2 * horizontalPadding,
      this.height - 2 * verticalPadding
    );
    ctx.fill();
  }

  updateController(): void {
    this.controller.setColor(
      `rgb(${Math.round(this.red_slider.percent * 255)}, ${Math.round(
        this.green_slider.percent * 255
      )}, ${Math.round(this.blue_slider.percent * 255)})`
    );
  }

  handleDrag(pos: Vector): boolean {
    if (
      pos.x < this.x ||
      pos.x > this.x + this.width ||
      pos.y < this.y ||
      pos.y > this.y + this.height
    ) {
      return false;
    }

    const redChange = this.red_slider.handleDrag(pos);
    const greenChange = this.green_slider.handleDrag(pos);
    const blueChange = this.blue_slider.handleDrag(pos);

    if (redChange || greenChange || blueChange) {
      this.updateController();
      return true;
    }
  }
}

class Slider {
  percent = 0;
  x: number;
  y: number;
  width: number;
  height: number;

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.rect(this.x, this.y, this.width, this.height);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = "white";
    ctx.rect(this.x + this.percent * this.width, this.y, 4, this.height);
    ctx.fill();
  }

  handleDrag(pos: Vector): boolean {
    if (pos.x < this.x || pos.x > this.x + this.width) {
      return false;
    }

    this.percent = (pos.x - this.x) / this.width;
    return true;
  }
}

export { Menu, Widget, ColorSelector };
