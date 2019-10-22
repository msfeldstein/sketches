const canvasSketch = require("canvas-sketch");

const settings = {
  dimensions: [2048, 2048]
};
const color1 = "#FFF";
const color2 = "#222";

const sketch = ({ context, width, height }) => {
  const rainfall = (context, x, y, length) => {
    context.beginPath();
    context.moveTo(x, y);
    const theta = Math.atan2(y - width / 2, x - height / 2);
    context.lineTo(x + Math.cos(theta) * length, y + Math.sin(theta) * length);
    context.strokeStyle = color1;
    context.lineWidth = 10;
    context.lineCap = "round";
    context.stroke();
  };
  const layerCanvas = document.createElement("canvas");
  layerCanvas.width = width;
  layerCanvas.height = height;
  const layerCtx = layerCanvas.getContext("2d");

  for (var i = 0; i < 3000; i++) {
    const theta = ((Math.PI * 2) / 300) * i;
    rainfall(
      layerCtx,
      width / 2 + (Math.cos(theta) * i) / 2,
      height / 2 + (Math.sin(theta) * i) / 2,
      (i / 10) * Math.random()
    );
  }
  console.log(layerCanvas);
  return ({ context, width, height }) => {
    context.fillStyle = color2;
    context.fillRect(0, 0, width, height);
    context.fillStyle = color2;
    context.fillRect(width / 2, 0, width / 2, height);
    context.globalCompositeOperation = "difference";
    context.drawImage(layerCanvas, 0, 0);
  };
};

canvasSketch(sketch, settings);
