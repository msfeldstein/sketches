const canvasSketch = require("canvas-sketch");

const settings = {
  dimensions: [2048, 2048],
  animate: true,
};

const RING_HEIGHT = 200;
const DNA_HEIGHT = 140;
const LINE_WIDTH = 18;
const FREQ = 16;
const PERIOD = 1.3;
const WAVE_WIDTH = 400;
const sketch = () => {
  /*
   * @param {object} params
   * @param {CanvasRenderingContext2D} params.context
   */
  const ret = ({ context, width, height, time }) => {
    /**  @type CanvasRenderingContext2D */
    const ctx = context;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);
    ctx.translate(width / 2, height / 2);
    ctx.lineWidth = LINE_WIDTH;

    ctx.beginPath();
    ctx.strokeStyle = "white";
    ctx.ellipse(
      0,
      0,
      RING_HEIGHT,
      RING_HEIGHT,
      -Math.PI / 2,
      Math.PI,
      Math.PI * 2
    ) * 2;
    ctx.lineWidth = LINE_WIDTH;
    ctx.stroke();

    /// DRAW LINES ABOVE

    ctx.strokeStyle = "black";
    ctx.lineCap = "butt";
    ctx.beginPath();
    for (var x = -WAVE_WIDTH; x < WAVE_WIDTH; x++) {
      ctx.lineTo(
        x,
        Math.cos((x / width) * FREQ + time * PERIOD) * DNA_HEIGHT - LINE_WIDTH
      );
    }
    ctx.stroke();
    ctx.beginPath();
    for (var x = -WAVE_WIDTH; x < WAVE_WIDTH; x++) {
      ctx.lineTo(
        x,
        Math.cos((x / width) * FREQ + time * PERIOD) * DNA_HEIGHT + LINE_WIDTH
      );
    }
    ctx.stroke();
    ctx.strokeStyle = "white";
    ctx.beginPath();
    for (var x = -WAVE_WIDTH; x < WAVE_WIDTH; x++) {
      ctx.lineTo(x, Math.cos((x / width) * FREQ + time * PERIOD) * DNA_HEIGHT);
    }
    ctx.stroke();

    ///// DRAW RING IN WHITE WITH BLACK OUTLINE
    context.strokeStyle = "white";
    ctx.beginPath();
    ctx.ellipse(0, 0, RING_HEIGHT, RING_HEIGHT, 0, -Math.PI / 2, Math.PI / 2);
    ctx.lineWidth = LINE_WIDTH;
    ctx.stroke();
    context.strokeStyle = "black";
    ctx.beginPath();
    ctx.ellipse(
      0,
      0,
      RING_HEIGHT + LINE_WIDTH,
      RING_HEIGHT + LINE_WIDTH,
      0,
      -Math.PI / 2,
      Math.PI / 2
    );
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(
      0,
      0,
      RING_HEIGHT - LINE_WIDTH,
      RING_HEIGHT - LINE_WIDTH,
      0,
      -Math.PI / 2,
      Math.PI / 2
    );
    ctx.stroke();
  };
  return ret;
};

canvasSketch(sketch, settings);
