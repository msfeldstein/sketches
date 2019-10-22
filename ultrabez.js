const canvasSketch = require("canvas-sketch");

const settings = {
  dimensions: [2048, 2048],
  animate: true
};

const interpolate = (p1, p2, t) => {
  return [p1[0] * (1 - t) + p2[0] * t, p1[1] * (1 - t) + p2[1] * t];
};

const dot = (context, p) => {
  context.fillStyle = "black";
  context.beginPath();
  context.arc(...p, 10, 0, Math.PI * 2);
  context.fillRect(p[0] - 5, p[1] - 5, 10, 10);
  context.fill();
};
const sketch = ({ canvas, context, width, height }) => {
  const points = [
    [canvas.width / 2, 100],
    [canvas.width - 100, canvas.height / 2],
    [canvas.width / 2, canvas.height - 100],
    [100, canvas.height / 2]
  ];
  canvas.addEventListener("click", e => {
    points.push([
      (e.offsetX * canvas.width) / parseInt(canvas.style.width),
      (e.offsetY * canvas.height) / parseInt(canvas.style.height)
    ]);
  });
  return ({ context, width, height, time }) => {
    context.fillStyle = "white";
    context.fillRect(0, 0, width, height);
    context.fillStyle = "black";
    const drawInto = (points, steps) => {
      if (steps == 0) return;
      const nextPoints = [];
      for (var i = 0; i < points.length; i++) {
        const p1 = points[i];
        dot(context, p1);
        const p2 = points[(i + 1) % points.length];
        const p3 = points[(i + 2) % points.length];

        context.beginPath();
        context.lineWidth = 4;
        // context.moveTo(...p1);
        // context.lineTo(...p2);
        // context.lineTo(...p3);
        // context.stroke();
        const t = 0.5 + Math.cos(time / 2) * 0.5;
        const c1 = interpolate(p1, p2, t);
        const c2 = interpolate(p2, p3, t);
        nextPoints.push(c1);

        context.beginPath();
        // context.moveTo(...c1);
        // context.lineTo(...c2);
        context.stroke();
        context.fill();
      }
      drawInto(nextPoints, steps - 1);
    };
    drawInto(points, 100);
  };
};

canvasSketch(sketch, settings);
