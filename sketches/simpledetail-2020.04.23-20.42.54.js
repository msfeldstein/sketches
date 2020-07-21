const canvasSketch = require("canvas-sketch");

const settings = {
  dimensions: [2048, 2048],
  animate: true,
};

const sketch = ({ context, width, height }) => {
  context.fillStyle = "white";
  context.fillRect(0, 0, width, height);

  // return ({ context, width, height }) => {
  context.beginPath();
  context.arc(width / 2, height / 2, width / 2, 0, Math.PI * 2);
  context.clip();
  context.fillStyle = "rgba(0,0,0,0.01)";
  for (var i = 0; i < 45000; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    context.beginPath();
    context.arc(x, y, 40, 0, Math.PI * 2);
    context.fill();
  }
  // };
};

canvasSketch(sketch, settings);
