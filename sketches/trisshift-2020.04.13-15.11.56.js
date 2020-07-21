const canvasSketch = require("canvas-sketch");

const settings = {
  dimensions: [2048, 2048],
  animate: true,
};

const sketch = ({ context, width, height }) => {
  const drawTri = (x, y, size, up) => {
    context.beginPath();
    let start = up ? Math.PI / 2 : -Math.PI / 2;
    let first = false;
    for (
      let theta = start;
      theta <= start + Math.PI * 2;
      theta += (Math.PI * 2) / 3
    ) {
      context[first ? "moveTo" : "lineTo"](
        x + size * Math.cos(theta),
        y + size * Math.sin(theta)
      );
    }
    context.closePath();
    context.stroke();
  };

  const tris = [];
  const size = 130;
  const thick = 10;
  let inset = true;
  const xoff = (size * Math.sqrt(3)) / 2;
  for (var y = 0; y < height; y += xoff / 2 + size + thick) {
    inset = !inset;
    for (var x = inset ? -xoff : 0; x < width; x += xoff * 2) {
      tris.push({ x, y, up: true });
      tris.push({ x: x + xoff, y: y + size / 2, up: false });
    }
  }

  return ({ context, width, height, time }) => {
    context.fillStyle = "black";
    context.fillRect(0, 0, width, height);
    context.strokeStyle = "white";
    context.lineWidth = thick;
    context.lineJoin = "round";

    context.globalCompositeOperation = "lighten";

    const drawSeparatedTri = (x, y, size, up) => {
      const p = Math.sin(time * 2);
      context.save();
      context.translate(200, 200);
      context.rotate((p * 0.5 + 0.5) * 1);
      context.translate(-200, -200);
      context.translate(15 * (p * 0.5 + 0.5), 15 * (p * 0.5 + 0.5));

      context.strokeStyle = "red";
      drawTri(x, y, 130, true);

      context.strokeStyle = "green";
      drawTri(x + 25 * p, y + 25 * p, size, up);

      context.strokeStyle = "blue";
      drawTri(x - 25 * p, y + 25 * p, size, up);
      context.restore();
    };
    tris.forEach((tri) => {
      drawSeparatedTri(tri.x, tri.y, size, tri.up);
    });
  };
};

canvasSketch(sketch, settings);
