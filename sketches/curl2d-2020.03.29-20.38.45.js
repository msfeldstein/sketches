const canvasSketch = require("canvas-sketch");
const noise = require("../perlin").noise;
const eps = 0.00001;

const settings = {
  dimensions: [2048, 2048],
  animate: true
};
const colors = [
  "#009C72",
  "#00B887",
  "#035055",
  "#00B855",
  "#00BF8E",
  "#00E7D0",
  "#00F0FB",
  "#007077",
  "#007179",
  "#00F0FB",
  "#00DFC2",
  "#009D5D"
];
/**
 * @param { Object } params
 * @param { CanvasRenderingContext2D} params.context
 * @param { number } params.width
 * @param { number } params.height
 */
const sketch = ({ width, height, context, canvas }) => {
  const mousePos = { x: 0, y: 0, active: false };
  canvas.addEventListener("mousemove", e => {
    mousePos.x = e.offsetX;
    mousePos.y = e.offsetY;
  });
  canvas.addEventListener("mousedown", () => (mousePos.active = true));
  canvas.addEventListener("mouseup", () => (mousePos.active = false));
  const particles = [];
  for (var i = 0; i < 4000; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }

  const field = (x, y) => {
    return noise.simplex2(x / 300, y / 300) * 0.5 + 0.5;
  };

  const stepParticle = particle => {
    // const dpDx =
    //   (noise.simplex2(particle.x / 100 + eps, particle.y) -
    //     noise.simplex2(particle.x - eps, particle.y)) /
    //   (2 * eps);
    // const dpDy =
    //   (noise.simplex2(particle.x, particle.y + eps) -
    //     noise.simplex2(particle.x, particle.y - eps)) /
    //   (2 * eps);
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

  const drawParticle = particle => {
    context.beginPath();
    context.fillStyle = particle.color;
    context.fillRect(particle.x, particle.y, 1, 1);
  };

  // const imageData = context.getImageData(0, 0, width, height);
  // for (var y = 0; y < height; y++) {
  //   for (var x = 0; x < width; x++) {
  //     let n = field(x, y);
  //     let i = y * (width * 4) + x * 4;
  //     imageData.data[i] = imageData.data[i + 1] = imageData.data[i + 2] =
  //       n * 255;
  //   }
  // }
  // context.putImageData(imageData, 0, 0);
  return ({ context, width, height }) => {
    context.fillStyle = "rgba(255,255,255,0.03)";
    context.fillRect(0, 0, width, height);

    particles.forEach(stepParticle);
    particles.forEach(stepParticle);
    particles.forEach(stepParticle);
    particles.forEach(drawParticle);
    particles.forEach(stepParticle);
    particles.forEach(stepParticle);
    particles.forEach(stepParticle);
    particles.forEach(drawParticle);
  };
};

canvasSketch(sketch, settings);
