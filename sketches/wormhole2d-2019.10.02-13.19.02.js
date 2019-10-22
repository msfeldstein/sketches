const canvasSketch = require("canvas-sketch");

const settings = {
  dimensions: [2048, 2048]
};

const sketch = ({ context, width, height }) => {
  const circle = (cx, cy, r, strokeStyle, fillStyle) => {
    context.beginPath();
    context.arc(cx, cy, r, 0, Math.PI * 2);
    if (strokeStyle) {
      context.strokeStyle = strokeStyle;
      context.lineWidth = 4;
      context.stroke();
    }
    if (fillStyle) {
      context.fillStyle = fillStyle;
      context.fill();
    }
  };

  const line = (x1, y1, x2, y2, color) => {
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.lineWidth = 2;
    context.strokeStyle = color;
    context.stroke();
  };

  const tri = (x1, y1, x2, y2, x3, y3, split) => {
    const color = "#black";
    const dotSize = 10;
    // circle(x1, y1, dotSize, color);
    // circle(x2, y2, dotSize, color);
    // circle(x3, y3, dotSize, color);
    line(x1, y1, x2, y2, color);
    line(x2, y2, x3, y3, color);
    line(x3, y3, x1, y1, color);
    const canSplit = Math.abs(x2 - x1) > 20 || Math.abs(y2 - y1) > 20;
    if (split && canSplit) {
      const newX = (x1 + x3) / 2;
      const newY = (y1 + y3) / 2;

      tri(x1, y1, newX, newY, x2, y2, Math.random() > Math.random());
      tri(x2, y2, newX, newY, x3, y3, Math.random() > 0.1);
    }
  };
  return ({ context, width, height }) => {
    context.fillStyle = "white";
    context.fillRect(0, 0, width, height);
    tri(20, 20, 20, height - 20, width - 20, height - 20, true);
    tri(20, 20, width - 20, 20, width - 20, height - 20, true);
  };
};

canvasSketch(sketch, settings);
