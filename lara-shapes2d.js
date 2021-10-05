const canvasSketch = require("canvas-sketch");

const settings = {
  dimensions: [2048, 2048],
};
const background = "rgb(131,213,187)";

const GRID_NOISE = 400;
const GRID_SPACING = 350;

const colors = [
  "rgb(130	68	127)", // purple
  "rgb(175	121	83)", // gold
  "rgb(242	162	159)", // pink
  "rgb(228	197	155	)", // yellow
];

const randomColor = () => {
  return colors[Math.floor(colors.length * Math.random())];
};

const sketch = ({}) => {
  return ({ context, width, height }) => {
    const drawShape = (x, y, w, h, rotation) => {
      const slope = h / 2;

      context.save();
      context.beginPath();
      context.translate(x, y);
      context.rotate(rotation);
      context.moveTo(0, 0);
      context.lineTo(w, 0);
      context.lineTo(w + slope, h);
      context.lineTo(slope, h);
      context.fill();
      context.restore();
    };

    context.fillStyle = background;
    context.fillRect(0, 0, width, height);
    for (x = -GRID_SPACING; x < width + GRID_SPACING; x += GRID_SPACING) {
      for (
        var y = -GRID_SPACING;
        y < height + GRID_SPACING;
        y += GRID_SPACING
      ) {
        const h = Math.random() * 450 + 100;
        const w = Math.random() * 450 + 100;

        context.fillStyle = randomColor();
        const randX = GRID_NOISE * Math.random() - GRID_NOISE / 2;
        const randY = GRID_NOISE * Math.random() - GRID_NOISE / 2;
        drawShape(
          x + randX,
          y + randY,
          w,
          h,
          Math.random() > 0.5 ? 0 : Math.PI / 3
        );
      }
    }
  };
};

canvasSketch(sketch, settings);
