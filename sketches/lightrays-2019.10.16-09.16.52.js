const canvasSketch = require("canvas-sketch");

const settings = {
  dimensions: [2048, 2048],
  animate: true
};

class Ray {
  constructor(x, y, dx, dy) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.power = 0.04;
  }

  step() {
    if (this.power <= 0) return;
    this.x += this.dx;
    this.y += this.dy;
    // this.power -= 0.0001;
    this.power;
  }

  draw(ctx) {
    if (this.power <= 0) return;
    ctx.globalAlpha = this.power;
    ctx.fillStyle = "white";
    ctx.fillRect(this.x, this.y, 1, 1);
  }
}

class ReflectorLine {
  constructor(x1, y1, x2, y2) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.moveTo(this.x1, this.y1);
    ctx.lineTo(this.x2, this.y2);
    ctx.strokeStyle = "white";
    ctx.globalAlpha = 1;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
const rays = [];
const reflectors = [];
const sketch = ({ context, width, height }) => {
  context.fillStyle = "black";
  context.fillRect(0, 0, width, height);
  for (var theta = -Math.PI / 7; theta < Math.PI / 7; theta += 0.0001) {
    const dx = Math.cos(theta);
    const dy = Math.sin(theta);
    rays.push(new Ray(100, height / 2, dx, dy));
  }
  reflectors.push(
    new ReflectorLine((width * 3) / 4, 400, (width * 3) / 4, height - 400)
  );
  reflectors.forEach(ref => {
    ref.draw(context);
  });
  return ({ context, width, height }) => {
    rays.forEach(ray => {
      ray.step();
      ray.draw(context);
    });
  };
};

canvasSketch(sketch, settings);
