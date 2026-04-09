const canvasSketch = require("canvas-sketch");

const settings = {
  dimensions: [2048, 2048],
  animate: true,
};

const NUM_CIRCLES = 24;
const BASE_RADIUS = 900;
const ZOOM_SPEED = 0.6;
const LINE_WIDTH = 3;

const palette = [
  "#264653",
  "#2a9d8f",
  "#e9c46a",
  "#f4a261",
  "#e76f51",
  "#606c38",
  "#283618",
  "#dda15e",
];

const sketch = () => {
  return ({ context: ctx, width, height, time }) => {
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;

    const cycle = (time * ZOOM_SPEED) % 1;

    for (let i = 0; i < NUM_CIRCLES; i++) {
      const t = (i + cycle) / NUM_CIRCLES;
      const radius = BASE_RADIUS * t;

      if (radius < 2) continue;

      const alpha = Math.sin(t * Math.PI) * 0.8 + 0.2;
      const colorIdx = i % palette.length;
      const color = palette[colorIdx];

      const wobble = Math.sin(time * 1.2 + i * 0.7) * 8 * t;
      const wobbleY = Math.cos(time * 0.9 + i * 0.5) * 8 * t;

      ctx.beginPath();
      ctx.ellipse(
        cx + wobble,
        cy + wobbleY,
        radius,
        radius * (0.95 + 0.05 * Math.sin(time + i)),
        (time * 0.1 + i * 0.05),
        0,
        Math.PI * 2
      );
      ctx.strokeStyle = color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = LINE_WIDTH + t * 4;
      ctx.stroke();
    }

    ctx.globalAlpha = 1;

    for (let ring = 0; ring < 3; ring++) {
      const ringCycle = ((time * ZOOM_SPEED * (0.5 + ring * 0.3)) + ring * 0.33) % 1;

      for (let i = 0; i < NUM_CIRCLES; i++) {
        const t = (i + ringCycle) / NUM_CIRCLES;
        const radius = BASE_RADIUS * 0.6 * t;

        if (radius < 1) continue;

        const alpha = Math.sin(t * Math.PI) * 0.3;
        if (alpha <= 0) continue;

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = palette[(i + ring * 3) % palette.length];
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 1 + t * 2;
        ctx.stroke();
      }
    }

    ctx.globalAlpha = 1;
  };
};

canvasSketch(sketch, settings);
