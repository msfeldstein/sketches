const canvasSketch = require("canvas-sketch");

const settings = {
  dimensions: [2048, 2048],
  animate: true
};

const sketch = ({ context }) => {
  const hexagon = size => {
    context.beginPath();
    context.moveTo(0, size);
    for (var side = 0; side < 7; side++) {
      const theta = (2 * Math.PI * side) / 6;
      context.lineTo(size * Math.cos(theta), size * Math.sin(theta));
    }
    context.fill();
  };
  return ({ context, width, height, time }) => {
    context.fillStyle = "#45caf7";
    context.fillRect(0, 0, width, height);
    const size = width / 50;
    context.strokeStyle = "white";
    context.fillStyle = "black";
    for (var y = size; y < height; y += size * 2) {
      for (var x = size; x < width; x += size * 2) {
        context.save();
        context.translate(x, y);
        // context.rotate(time + x + y);
        const s = 1 + 0.6 * Math.sin(-time + x + y);
        context.scale(s, s);
        hexagon(size);
        context.restore();
      }
    }
  };
};

canvasSketch(sketch, settings);
