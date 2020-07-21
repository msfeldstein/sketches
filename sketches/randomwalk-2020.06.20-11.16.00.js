const canvasSketch = require("canvas-sketch");
const SimplexNoise = require("simplex-noise");

const noise = new SimplexNoise();

const settings = {
  dimensions: [2048, 2048],
  animate: true,
  fps: 24,
};
const rand = (min, max) => {
  return min + Math.random() * (max - min);
};
const SCALE = 3;
let frame = 0;
const sketch = ({ context, width, height }) => {
  class Walker {
    constructor(px, py, vx, vy, seed) {
      this.startX = px;
      this.startY = py;
      this.x = px;
      this.y = py;
      this.vx = vx;
      this.vy = vy;
      this.seed = seed + rand(-0.05, 0.05);
    }

    update(t) {
      const lastX = this.x;
      const lastY = this.y;
      this.vx += noise.noise3D(this.startX, this.startY + t, 1 + this.seed);
      this.vy += noise.noise3D(this.startX, this.startY + t, 2 + this.seed);
      this.x += this.vx;
      this.y += this.vy;
      context.beginPath();
      context.moveTo(lastX, lastY);
      context.lineTo(this.x, this.y);
      context.stroke();
    }
  }
  const walkers = [];
  const cx = width / 2;
  const cy = height / 2;
  for (var i = 0; i < 15; i++) {
    const vx = rand(-1, 1);
    const vy = rand(-1, 1);
    for (var j = 0; j < 20; j++) {
      walkers.push(new Walker(cx, cy, vx, vy, i));
    }
  }

  context.fillStyle = "white";
  context.fillRect(0, 0, width, height);
  return ({ context, width, height, time }) => {
    frame++;
    if (frame > 100) {
      return;
    }
    context.lineWidth = 1;
    context.strokeStyle = "rgba(0,0,0,0.2)";
    walkers.forEach((w) => w.update(time));
    console.log(frame);
  };
};

canvasSketch(sketch, settings);
