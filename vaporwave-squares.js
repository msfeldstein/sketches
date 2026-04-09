const canvasSketch = require("canvas-sketch");

const settings = {
  dimensions: [2048, 2048],
  animate: true,
};

const VAPORWAVE_COLORS = [
  "#FF71CE", // hot pink
  "#01CDFE", // cyan
  "#05FFA1", // mint green
  "#B967FF", // purple
  "#FFFB96", // pale yellow
  "#FE53BB", // magenta
  "#09FBD3", // teal
  "#F5D300", // gold
  "#FF6EC7", // neon pink
  "#7B68EE", // medium slate blue
  "#CF6EE4", // orchid
  "#00F5D4", // turquoise
];

const NUM_SQUARES = 60;

function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const rand = seededRandom(42);

const squares = Array.from({ length: NUM_SQUARES }, (_, i) => ({
  x: rand() * 2048,
  y: rand() * 2048,
  size: 40 + rand() * 260,
  rotation: rand() * Math.PI * 2,
  rotationSpeed: (rand() - 0.5) * 1.2,
  driftX: (rand() - 0.5) * 60,
  driftY: (rand() - 0.5) * 60,
  color: VAPORWAVE_COLORS[Math.floor(rand() * VAPORWAVE_COLORS.length)],
  alpha: 0.3 + rand() * 0.5,
  hollow: rand() > 0.5,
  lineWidth: 3 + rand() * 10,
}));

const sketch = () => {
  return ({ context, width, height, time }) => {
    const ctx = context;

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#0D0221");
    gradient.addColorStop(0.5, "#261447");
    gradient.addColorStop(1, "#0D0221");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    for (const sq of squares) {
      ctx.save();

      const x = sq.x + Math.sin(time * 0.4 + sq.driftX) * sq.driftX;
      const y = sq.y + Math.cos(time * 0.3 + sq.driftY) * sq.driftY;
      const rotation = sq.rotation + time * sq.rotationSpeed;

      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.globalAlpha = sq.alpha + Math.sin(time * 1.5 + sq.rotation) * 0.15;

      if (sq.hollow) {
        ctx.strokeStyle = sq.color;
        ctx.lineWidth = sq.lineWidth;
        ctx.strokeRect(
          -sq.size / 2,
          -sq.size / 2,
          sq.size,
          sq.size
        );
      } else {
        ctx.fillStyle = sq.color;
        ctx.fillRect(
          -sq.size / 2,
          -sq.size / 2,
          sq.size,
          sq.size
        );
      }

      ctx.restore();
    }

    ctx.globalAlpha = 1;
  };
};

canvasSketch(sketch, settings);
