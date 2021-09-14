const canvasSketch = require("canvas-sketch");
const noise = require("../perlin").noise;
const eps = 0.0001;

const noiseScale = 14000;
const strokeColor = "black";
const backgroundColor = "#064273";
const colors = [
  // "#009C72",
  // "#00B887",
  // "#035055",
  // "#00B855",
  // "#00BF8E",
  // "#00E7D0",
  // "#00F0FB",
  // "#007077",
  // "#007179",
  // "#00F0FB",
  // "#00DFC2",
  // "#009D5D",

  // "#17DEEE",
  // "#FF7F50",
  // "#FF4162",
  // "#F2E50B",
  // "#21B20C",

  // "#8ae0c5",
  // "#a5e8db",
  // "#95c8d4",
  // "#90a8c9",
  // "#b3abd6",

  // "#064273",
  "#76b6c4",
  "#7fcdff",
  "#1da2d8",
  "#def3f6",
];
const settings = {
  dimensions: [2048, 2048],
  animate: true,
};

let nextRand = 2;
function random() {
  return noise.simplex2(0, nextRand++) * 0.5 + 0.5;
}

/**
 * @param { Object } params
 * @param { CanvasRenderingContext2D} params.context
 * @param { number } params.width
 * @param { number } params.height
 */
const sketch = ({ width, height, context, canvas }) => {
  return ({ context, width, height, frame, time }) => {
    nextRand = frame / 100000000 + 3;
    const particles = [];
    for (var i = 0; i < 400; i++) {
      particles.push({
        origX: random() * width,
        origY: random() * height,
        color: colors[Math.floor(random() * colors.length)],
      });
    }

    const xOff = random() * 10000;
    const yOff = random() * 10000;

    particles.forEach((particle) => {
      particle.x = particle.origX;
      particle.y = particle.origY;
    });
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, width, height);

    const field = (x, y) => {
      return (
        noise.simplex2(
          x / noiseScale + xOff + 0 / 1000,
          y / noiseScale + yOff
        ) *
          0.5 +
        0.5
      );
    };
    const stepParticle = (particle) => {
      const dpDx =
        (field(particle.x + eps, particle.y) -
          field(particle.x - eps, particle.y)) /
        (2 * eps);
      const dpDy =
        (field(particle.x, particle.y + eps) -
          field(particle.x, particle.y - eps)) /
        (2 * eps);

      const curl = [dpDy, -dpDx];
      particle.x += dpDy * 320 + 0.0;
      particle.y += -dpDx * 320;
    };

    // context.shadowColor = "rgba(0,0,0,1.0)";
    // context.shadowBlur = 15;

    particles.forEach((particle) => {
      if (
        particle.x > width * 0.9 ||
        particle.x < width * 0.1 ||
        particle.y > height * 0.9 ||
        particle.y < height * 0.1
      )
        return;
      // particle.x = particle.origX;
      // particle.y = particle.origY;
      context.lineCap = "round";
      context.beginPath();
      context.moveTo(particle.x, particle.y);
      const steps = 200 + random() * 4000;
      for (var i = 0; i < steps; i++) {
        for (var j = 0; j < 20 * random(); j++) {
          stepParticle(particle);
          context.lineTo(particle.x, particle.y);
        }
        if (
          particle.x > width * 0.9 ||
          particle.x < width * 0.1 ||
          particle.y > height * 0.9 ||
          particle.y < height * 0.1
        )
          break;
        // if (Math.random() > 0.999) {
        //   context.lineWidth = 30;
        //   context.strokeStyle = strokeColor;
        //   context.stroke();
        //   context.lineWidth = 20;
        //   context.strokeStyle = particle.color;
        //   context.stroke();
        //   context.beginPath();
        // }
      }
      context.lineWidth = 30;
      context.strokeStyle = "black";
      context.stroke();
      context.lineWidth = 20;
      context.strokeStyle = particle.color;
      context.stroke();
    });
  };
};

canvasSketch(sketch, settings);
