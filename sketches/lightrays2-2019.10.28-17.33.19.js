const canvasSketch = require("canvas-sketch");

const settings = {
  dimensions: [2048, 2048]
};

const sketch = ({ context, width, height }) => {
  const prismX = width / 2;
  const ray = (x, y, dx, dy, color = "white") => {
    context.fillStyle = color;

    if (x < width && x > 0 && y > 0 && y < height) {
      context.fillRect(x, y, 1, 1);
      if (color === "white" && x > prismX) {
        for (var theta = -Math.PI / 6; theta < Math.PI / 6; theta += 0.001) {
          const newDX = Math.cos(theta);
          const newDY = Math.sin(theta);
          ray(
            x + newDX,
            y + newDY,
            newDX,
            newDY,
            `hsla(${Math.floor(theta * 360)}, 100%, 50%, 0.5)`
          );
        }
      } else {
        ray(x + dx, y + dy, dx, dy, color);
      }
    }
  };
  return ({ context, width, height }) => {
    context.fillStyle = "black";
    context.fillRect(0, 0, width, height);
    for (var theta = -Math.PI / 6; theta < Math.PI / 6; theta += 0.01) {
      const newDX = Math.cos(theta);
      const newDY = Math.sin(theta);
      ray(width / 4, height / 2, newDX, newDY);
    }
  };
};

canvasSketch(sketch, settings);
