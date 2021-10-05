const canvasSketch = require("canvas-sketch");

const settings = {
  dimensions: [2048, 2048],
};

const sketch = () => {
  const percent = 0.3;
  return ({ context, width, height }) => {
    function tri(x1, y1, x2, y2, x3, y3, levels) {
      context.beginPath();
      context.moveTo(x1, y1);
      context.lineTo(x2, y2);
      context.lineTo(x3, y3);
      context.lineTo(x1, y1);
      context.stroke();
      if (levels > 0) {
        levels--;
        const w2 = w / 2;
        const h2 = h / 2;
        const w2L = w * percent;
        const w2R = w - w2L;
        const h2T = h * percent;
        const h2B = h - h2T;
        // left
        // tri(x, y, w2, h2, levels);
        // right
        // tri(x + w2L, y, w2, h2B, levels);
        // // top/center
        // tri(x + w2L / 2, y + h2T, w2L, h2T, levels);
      }
    }
    context.fillStyle = "white";
    context.fillRect(0, 0, width, height);
    tri(0, 0, width, 0, width / 2, height);
    context.strokeStyle = "black";
  };
};

canvasSketch(sketch, settings);
