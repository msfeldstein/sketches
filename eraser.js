const canvasSketch = require("canvas-sketch");
const tf = require("@tensorflow/tfjs-node");
const bodyPix = require("@tensorflow-models/body-pix");
const Jimp = require("jimp");

const settings = {
  dimensions: [2048, 2048],
};

const loadImage = (src) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      resolve(img);
    };
  });
};

const sketch = () => {
  return async ({ context, width, height }) => {
    const img = await loadImage("sunset.jpg");
    console.log(img);
    context.drawImage(img, 0, 0);
  };
};

canvasSketch(sketch, settings);
