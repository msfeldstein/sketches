const canvasSketch = require("canvas-sketch");

const G = 9.8;
const settings = {
  dimensions: [2048, 2048],
  animate: true
};

class Particle {
  constructor(width, height) {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.mass = 0.1 + 0.1 * Math.random();
    const theta = Math.atan2(this.y - height / 2, this.x - width / 2);
    const s = Math.random() * 15;
    this.vx = s * Math.cos(theta - Math.PI / 2);
    this.vy = s * Math.sin(theta - Math.PI / 2);
  }

  interact(attractor) {
    const dx = attractor.x - this.x;
    const dy = attractor.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const f = (G * attractor.mass * this.mass) / (distance * distance);
    const a = f / this.mass;
    const ax = dx * a;
    const ay = dy * a;
    this.vx += ax;
    this.vy += ay;

    this.x += this.vx;
    this.y += this.vy;
  }

  draw(context) {
    context.fillRect(this.x, this.y, 3, 3);
  }
}

class Attractor {
  constructor(x, y, mass, size) {
    this.x = x;
    this.y = y;
    this.mass = mass;
    this.size = size;
  }

  draw(context) {
    context.strokeStyle = "white";
    context.lineWidth = 4;
    context.beginPath();
    context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    context.stroke();
  }
}

const sketch = ({ width, height, context }) => {
  const particles = [];
  const attractors = [];
  attractors.push(new Attractor(width / 2, height / 2, 4, 50));

  for (var i = 0; i < 10000; i++) {
    particles.push(new Particle(width, height));
  }
  return ({ context, width, height }) => {
    context.fillStyle = "black";
    context.fillRect(0, 0, width, height);
    context.fillStyle = "white";
    attractors.forEach(a => {
      for (var i = 0; i < particles.length; i++) {
        particles[i].interact(a);
      }
      a.draw(context);
    });
    for (var i = 0; i < particles.length; i++) {
      for (var j = i + 1; j < particles.length; j++) {
        particles[i].interact(particles[j]);
        particles[j].interact(particles[i]);
      }
      particles[i].draw(context);
    }
  };
};

canvasSketch(sketch, settings);
