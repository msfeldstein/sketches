const canvasSketch = require("canvas-sketch");
const colormap = require("colormap");
const ScalarNoiseGenerator = require("../atlas-scalar-noise");

const settings = {
  animate: true,
};

let colors = colormap({
  colormap: "magma",
  nshades: 11,
  format: "hex",
  alpha: 1,
});
const NoisePeriod = 10;
const NoiseAmount = 70;
const smallSquareGrid = new ScalarNoiseGenerator(NoisePeriod);
const Noise = require("quick-noise-js").noise;
const sketch = () => {
  return ({ time, canvas, context, width, height }) => {
    context.fillStyle = colors[colors.length];
    context.fillRect(0, 0, width, height);
    context.translate(width / 2, height / 2);
    colors.forEach((color, i) => {
      const r = 20 + 50 * i;
      context.beginPath();
      for (var theta = 0; theta <= Math.PI * 2; theta += 2 * Math.PI * 0.01) {
        // let jitterR = r + noise.simplex2(theta % (2 * Math.PI), i) * 40
        let jitterR =
          r +
          Noise((theta / (2 * Math.PI)) * NoisePeriod, i + time / 7, 0) *
            NoiseAmount;
        const x = Math.cos(theta) * jitterR;
        const y = Math.sin(theta) * jitterR;
        context.lineTo(x, y, 3, 3);
      }
      context.lineTo(width / 2, 0);
      context.lineTo(width / 2, -height / 2);
      context.lineTo(-width / 2, -height / 2);
      context.lineTo(-width / 2, height / 2);
      context.lineTo(width / 2, height / 2);
      context.lineTo(width / 2, 0);
      context.fillStyle = color;
      context.shadowOffsetX = 0;
      context.shadowOffsetY = 0;
      context.shadowBlur = 50;
      context.shadowColor = "rgba(0,0,0,0.6)";
      context.fill();
    });
  };
};

canvasSketch(sketch, settings);
