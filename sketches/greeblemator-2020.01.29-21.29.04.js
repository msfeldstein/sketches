const canvasSketch = require("canvas-sketch");
const load = require("load-asset");

const settings = {
  dimensions: [2048, 2048],
  animate: true
};

const fadingCanvas = document.createElement("canvas");
fadingCanvas.width = 256;
fadingCanvas.height = 256;
const fadingCtx = fadingCanvas.getContext("2d");

const sketch = async ({ context, width, height }) => {
  const greebleImages = await Promise.all(
    [1, 2, 3].map(i => load(`sketches/assets/greebles/greeble${i}.png`))
  );

  for (var i = 1; i <= 3; i++) {}
  class Greeble {
    constructor() {
      this.reset();
      this.life = Math.random();
    }

    reset() {
      this.x = Math.random() * width - 24;
      this.y = Math.random() * height - 24;
      this.width = Math.random() * 256 + 24;
      this.height = Math.random() * 256 + 24;
      this.life = 0;
      this.speed = Math.random() * 0.002 + 0.005;
      this.image = Math.floor(Math.random() * 3);
      this.useImage = Math.random() > 0.85;
    }

    draw() {
      this.life += this.speed;
      if (this.life >= 1) this.reset();
      const opacity = Math.sin(this.life * Math.PI);

      if (this.useImage) {
        fadingCtx.globalCompositeOperation = "source-over";
        fadingCtx.fillStyle = "black";
        fadingCtx.fillRect(0, 0, fadingCanvas.width, fadingCanvas.height);
        fadingCtx.globalAlpha = opacity;
        fadingCtx.drawImage(greebleImages[this.image], 0, 0);
        context.drawImage(fadingCanvas, this.x, this.y);
      } else {
        const c = opacity * 255;
        context.fillStyle = `rgb(${c}, ${c}, ${c})`;
        context.fillRect(this.x, this.y, this.width, this.height);
      }
    }
  }
  const greebles = [];
  for (var i = 0; i < 520; i++) {
    greebles.push(new Greeble());
  }
  return ({ context, width, height }) => {
    context.fillStyle = "black";
    context.fillRect(0, 0, width, height);
    context.globalCompositeOperation = "lighten";
    greebles.forEach(greeble => greeble.draw());
  };
};

canvasSketch(sketch, settings);
