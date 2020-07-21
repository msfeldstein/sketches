const canvasSketch = require("canvas-sketch");

const settings = {
  dimensions: [2048, 2048],
};

const iter = 20;

const sketch = () => {
  const c = { x: 0.5, y: 0.5 };
  return ({ context, width, height }) => {
    const imageData = context.getImageData(0, 0, width, height);
    const pix = imageData.data;
    for (var x = 0; x < width; x++) {
      for (var y = 0; y < height; y++) {
        const z = { x: x / width - 0.5, y: y / height - 0.1 };
        z.x *= 0.5;
        z.y *= 0.5;
        let i = 0;
        for (i = 0; i < iter; i++) {
          let x = z.x * z.x - z.y * z.y + c.x;
          let y = z.x * z.y + z.x * z.y + c.y;
          if (x * x + y * y > 100) break;
          z.x = x;
          z.y = y;
        }
        let val = i / iter - (z.x * z.x + z.y * z.y) / 100;
        const p = (y * width + x) * 4;
        pix[p] = val * 255;
        pix[p + 1] = val * 255;
        pix[p + 2] = val * 255;
        pix[p + 3] = 255;
      }
    }
    context.putImageData(imageData, 0, 0);
  };
};

canvasSketch(sketch, settings);
