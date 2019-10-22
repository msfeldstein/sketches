const canvasSketch = require("canvas-sketch");

const settings = {
  dimensions: [2048, 2048],
  animate: true
};

const sketch = ({ context, width, height }) => {
  const rainbowCanvas = document.createElement("canvas");
  rainbowCanvas.width = width;
  rainbowCanvas.height = 200;
  const rCtx = rainbowCanvas.getContext("2d");
  for (var x = 0; x < width; x++) {
    line(rCtx, x, 0, x, 200, {
      strokeStyle: `hsl(${(x / width) * 360}, 100%, 50%)`
    });
  }
  function line(context, x1, y1, x2, y2, opts) {
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.lineWidth = opts.lineWidth;
    context.strokeStyle = opts.strokeStyle;
    context.stroke();
  }

  function rect(context, x1, y1, w, h, opts) {
    context.beginPath();
    context.rect(x1, y1, w, h);
    context.lineWidth = opts.lineWidth;
    if (opts.strokeStyle) {
      context.strokeStyle = opts.strokeStyle;
      context.stroke();
    }
    if (opts.fillStyle) {
      context.fillStyle = opts.fillStyle;
      context.fill();
    }
  }

  return ({ context, width, height, time }) => {
    context.fillStyle = "white";
    context.fillRect(0, 0, width, height);
    context.drawImage(rainbowCanvas, 0, 0);
    const theta = (time % 2) * Math.PI;
    const color = `hsl(${(theta / 2 / Math.PI) * 360}, 100%, 50%)`;
    rect(
      context,
      (time * 1000) % width,
      0,
      (time % width) + 10,
      rainbowCanvas.height,
      {
        strokeStyle: "black",
        lineWidth: 3
      }
    );
    rect(context, 0, 200, width, 30, {
      fillStyle: color
    });
    context.save();
    context.translate(width / 2, height / 2);
    context.restore();
  };
};

canvasSketch(sketch, settings);
