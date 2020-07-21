const canvasSketch = require("canvas-sketch");
const noise = require("../perlin").noise;

const colors = [
  "#009C72",
  "#00B887",
  "#035055",
  "#00B855",
  "#00BF8E",
  "#00E7D0",
  "#00F0FB",
  "#007077",
  "#007179",
  "#00F0FB",
  "#00DFC2",
  "#009D5D"
];

const treeColors = ["#009BB0", "#004763", "#0A1A26"];
const settings = {
  dimensions: [2048, 2048],
  // dimensions: [512, 512],
  animate: true
};

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

function getColorIndicesForCoord(x, y, width) {
  var red = y * (width * 4) + x * 4;
  return [red, red + 1, red + 2, red + 3];
}
/**
 * @param { string} hex
 */
function hexToRgb(hex) {
  return [
    parseInt(hex.substr(1, 2), 16),
    parseInt(hex.substr(3, 2), 16),
    parseInt(hex.substr(5, 2), 16)
  ];
}

function rgbToHex(rgb) {
  return `#${rgb[0].toString(16).padStart(2, "0")}${rgb[1]
    .toString(16)
    .padStart(2, "0")}${rgb[2].toString(16).padStart(2, "0")}`;
}

let rVal = 0;
function random() {
  return noise.simplex2(rVal++, 0) * 0.5 + 0.5;
}
function varyColor(hex) {
  const rgb = hexToRgb(hex);
  const r1 = Math.floor(random() * 20 - 10);
  const r2 = Math.floor(random() * 20 - 10);
  const r3 = Math.floor(random() * 20 - 10);
  rgb[0] = clamp(rgb[0] + r1, 0, 255);
  rgb[1] = clamp(rgb[1] + r1, 0, 255);
  rgb[2] = clamp(rgb[2] + r1, 0, 255);
  return rgbToHex(rgb);
}

function writeColorPixel(hex, x, y, imageData) {
  const [start] = getColorIndicesForCoord(x, y, imageData.width);
  const bytes = imageData.data;
  const rgb = hexToRgb(hex);
  for (var i = 0; i < rgb.length; i++) {
    bytes[start + i] = rgb[i];
  }
}

const sketch = () => {
  /**
   * @param { Object } params
   * @param { CanvasRenderingContext2D} params.context
   * @param { number } params.width
   * @param { number } params.height
   */
  const init = ({ context, width, height, time }) => {
    rVal = 0;
    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {CanvasRenderingContext2D} ctx
     */
    const drawTree = (x, y, ctx) => {
      ctx.beginPath();
      for (var i = 0; y + i < height; i++) {
        const width = Math.abs(
          (i / 2) * (0.5 + noise.simplex2(i * 20, x) * 0.5 + 0.5)
        );
        ctx.moveTo(x - width / 2, y + i);
        ctx.lineTo(x + width / 2, y + i);
      }
      ctx.stroke();
    };

    context.fillStyle = "rgba(255,255,255,1.0)";
    context.fillRect(0, 0, width, height);
    const imageData = context.getImageData(0, 0, width, height);
    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        let n = noise.simplex3((x / width) * 0.6, (y / height) * 1, time / 50);
        n = n / 2 + 0.5;
        const colorIdx = Math.floor(n * colors.length * 7) % colors.length;
        const color = colors[colorIdx];
        writeColorPixel(color, x, y, imageData);
      }
    }

    context.putImageData(imageData, 0, 0);
    context.globalCompositeOperation = "source-over";
    for (var x = 0; x < width + 100; x += width / 40) {
      context.lineWidth = 2;
      context.globalAlpha = 1;
      context.strokeStyle = varyColor(treeColors[0]);
      const y =
        (noise.simplex2(x / (width / 2), 0) * height) / 10 +
        (noise.simplex2(x / (width / 4), 50) * height) / 60 +
        (noise.simplex2(x / (width / 8), 500) * height) / 90 +
        height -
        height / 3;
      drawTree(x + noise.simplex2(x, 200) * 20, y, context, height);
    }
    for (var x = 0; x < width + 100; x += width / 30) {
      context.lineWidth = 2;
      context.strokeStyle = varyColor(treeColors[1]);

      const y =
        (noise.simplex2(x / (width / 2), 100) * height) / 30 +
        (noise.simplex2(x / (width / 4), 100) * height) / 60 +
        (noise.simplex2(x / (width / 8), 100) * height) / 90 +
        height -
        height / 3.4;
      drawTree(x + noise.simplex2(x, 300) * 20, y, context, height);
    }
    for (var x = 0; x < width + 100; x += width / 25) {
      context.globalAlpha = 1;
      context.lineWidth = 1;
      context.strokeStyle = varyColor(treeColors[2]);
      const y =
        (noise.simplex2(x / (width / 2), 200) * height) / 20 +
        (noise.simplex2(x / (width / 4), 200) * height) / 40 +
        (noise.simplex2(x / (width / 8), 200) * height) / 80 +
        height -
        height / 6;
      drawTree(x + noise.simplex2(x, 100) * 20, y, context, height);
    }
  };
  return init;
};

canvasSketch(sketch, settings);
