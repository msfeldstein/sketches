const canvasSketch = require("canvas-sketch");
const SimplexNoise = require("simplex-noise");
const glslify = require("glslify");
const noise = new SimplexNoise();

const settings = {
  dimensions: [2048, 2048],
};

const reticle = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "red";
  ctx.fillRect(0, 0, 128, 128);
  const dataUrl = canvas.toDataURL();
  return dataUrl;
};

const sketch = ({ canvas }) => {
  console.log(recticle());
  canvas.style.cursor = `url(${reticle()})`;
  return ({ canvas, context, width, height }) => {
    context.fillStyle = "black";
    context.fillRect(0, 0, width, height);

    context.strokeStyle = "white";
    context.lineWidth = 1;
    for (var y = 0; y < height; y += 8) {
      context.beginPath();
      for (var x = 0; x < width; x += 1) {
        const dx = width / 2 - x;
        const dy = height / 2 - y;
        const d = (Math.sqrt(dx * dx + dy * dy) / width) * 4;

        context.lineTo(x, y + d * noise.noise2D((x / width) * 10, y) * 10);
      }
      context.stroke();
    }
  };
};

canvasSketch(sketch, settings);
