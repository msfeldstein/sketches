const canvasSketch = require("canvas-sketch");
const noise = require("./perlin").noise;
const settings = {
  dimensions: [1024, 128],
  animate: true,
};

const rowSize = 1;
const sketch = () => {
  return ({ time, context, width, height }) => {
    context.fillStyle = "rgba(255,255,255,.01)";
    context.fillRect(0, 0, width, height);
    for (var y = 0; y < height; y += rowSize) {
      const speed = 200 + 200 * noise.simplex2(0, y * 100);
      const x = (time * speed + noise.simplex2(y, 0) * width) % width;
      context.fillStyle = "black";
      console.log(x);
      context.fillRect(x, y, 16, rowSize);
    }
  };
};

canvasSketch(sketch, settings);
