const canvasSketch = require("canvas-sketch");

const settings = {
  dimensions: [2048, 2048],
};

const sketch = () => {
  return ({ context, width, height }) => {
    context.fillStyle = "white";

    context.fillRect(0, 0, width, height);
    const doSquare = (x, y, s) => {
      const shouldSplit = Math.random() < (s / width) * 4;
      if (shouldSplit) {
        const hs = s / 2;
        doSquare(x, y, hs);
        doSquare(x + hs, y, hs);
        doSquare(x, y + hs, hs);
        doSquare(x + hs, y + hs, hs);
      } else {
        context.strokeStyle = "black";
        context.strokeRect(x, y, s, s);
      }
    };
    doSquare(0, 0, width, height);
  };
};

canvasSketch(sketch, settings);
