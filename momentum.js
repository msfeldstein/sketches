const canvasSketch = require("canvas-sketch");

const settings = {
  dimensions: [2048, 2048],
  animate: true
};

class Particle {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
  }

  attract(p) {
    this.vx += (this.x - p.x) / 100;
    this.vy += (this.y - p.y) / 100;
  }

  step() {
    this.x += this.vx;
    this.y += this.vy;
  }
}
const particles = [];
const newParticle = (x, y, vx, vy) => {
  particles.push(new Particle(x, y, vx, vy));
};

newParticle(300, 300, 10, 10);
newParticle(320, 300, 30, 10);
newParticle(330, 300, 10, -10);
console.log(particles);
const sketch = ({ w, h }) => {
  for (var i = 0; i < 10; i++) {
    newParticle(
      w * Math.random(),
      h * Math.random(),
      10 * Math.random() - 5,
      10 * Math.random() - 5
    );
  }
  const gravityWell = { x: w / 2, y: h / 2 };
  return ({ context, width, height }) => {
    context.fillStyle = "white";
    context.fillRect(0, 0, width, height);
    context.fillStyle = "black";
    particles.forEach(particle => {
      particle.attract(gravityWell);
      particle.step();
      context.beginPath();
      context.arc(particle.x, particle.y, 10, 0, Math.PI * 2);
      context.fill();
    });
  };
};

canvasSketch(sketch, settings);
