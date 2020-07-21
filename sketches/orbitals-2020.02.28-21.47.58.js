const canvasSketch = require("canvas-sketch");

const settings = {
  dimensions: [2048, 2048],
  animate: true
};

class Particle {
  constructor() {
    this.theta = Math.random() * Math.PI * 2;
    this.r = 300 + Math.random() * 150;
    this.v = Math.random() * 0.01 + 0.003;
  }

  draw(ctx) {
    this.theta += this.v;
    const { theta, r } = this;
    ctx.fillRect(Math.cos(theta) * r, Math.sin(theta) * r, 1, 1);
  }
}

const particles = [];
const sketch = () => {
  for (var i = 0; i < 1000; i++) {
    particles.push(new Particle());
  }
  return ({ context, width, height }) => {
    context.fillStyle = "black";
    context.fillRect(0, 0, width, height);

    context.fillStyle = "white";
    context.beginPath();
    context.arc(width / 2, height / 2, 60, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.fillStyle = "black";
    context.arc(width / 2, height / 2, 57, 0, Math.PI * 2);
    context.fill();
    context.globalCompositeOperation = "lighter";
    context.fillStyle = "rgba(255,255,255,0.3)";
    context.translate(width / 2, height / 2);
    for (var i = 0; i < particles.length; i++) {
      particles[i].draw(context);
    }
  };
};

canvasSketch(sketch, settings);
