const canvasSketch = require("canvas-sketch");
const noise = require("simplex-noise");
const settings = {
  dimensions: [2048, 2048]
};

const sketch = () => {
  return ({ context, width, height }) => {
    context.fillStyle = "black";
    context.fillRect(0, 0, width, height);
    context.translate(width / 2, height / 2);
    for (var theta = 0; theta < Math.PI * 2; theta += Math.PI / 100) {
      context.beginPath();
      context.strokeStyle = "white";
      context.lineWidth = 2;
      for (var r = width / 6; r < width / 2; r += 0.01) {
        if (Math.random() > 0.95) theta += (Math.random() - 0.5) * 0.02;
        context.lineTo(r * Math.cos(theta), r * Math.sin(theta));
      }
      context.stroke();
    }
  };
};

canvasSketch(sketch, settings);
