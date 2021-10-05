const canvasSketch = require("canvas-sketch");
const noise = require("./perlin").noise;
window.noise = noise;
const settings = {
  dimensions: [512, 512],
  animate: true,
};

function map(v, inMin, inMax, outMin, outMax) {
  return;
}

const X_SIZE = 8;
const Y_SIZE = 16;
const colors = ["#B31313", "#FDDA16", "#FF9000", "#FFEE82"];

function fbm(x, y) {
  const OCTAVES = 6;

  let normalize_factor = 0.0;
  let value = 0.0;
  let scale = 0.5;

  for (let i = 0; i < OCTAVES; i++) {
    value += noise.simplex2(x, y) * scale;
    normalize_factor += scale;
    x *= 2.0;
    y *= 2.0;
    scale *= 0.5;
  }
  return (value / normalize_factor) * 0.5 + 0.5;
}

function overlay(base, top) {
  if (base < 0.5) {
    return 2.0 * base * top;
  } else {
    return 1.0 - 2.0 * (1 - base) * (1 - top);
  }
}

const sketch = () => {
  return ({ context, width, height, time }) => {
    context.fillStyle = "black";
    context.fillRect(0, 0, width, height);
    // context.fillStyle = colors[0];
    for (var x = 0; x < width; x += X_SIZE) {
      for (var y = 0; y < height; y += Y_SIZE) {
        const xNorm = x / width;
        const yNorm = y / height;
        const coordX = x / 12 / X_SIZE;
        const coordY = y / 12 / Y_SIZE;
        const fbmX = coordX / 6;
        const fbmY = coordY / 6;
        const n = noise.simplex2(coordX + time * -0.45, coordY + time);
        const noise1 = n * 0.5 + 0.5;
        const n2 = noise.simplex2(coordX + time * -0.95, coordY + time * 2);
        const noise2 = n2 * 0.5 + 0.5;
        const combined = (noise1 + noise2) * 0.7;
        const fbmNoise = fbm(fbmX, fbmY + time * 0.8);
        const fadeFbmNoise = overlay(fbmNoise, yNorm - 0.1);
        const value = fadeFbmNoise;
        const percent = value * 100;
        context.fillStyle = `hsl(0.0, 100%, ${percent}%)`;
        context.fillRect(x, y, X_SIZE, Y_SIZE);
      }
    }
  };
};

canvasSketch(sketch, settings);

// for (var x = 0; x < width; x += X_SIZE) {
//       for (var y = 0; y < height; y += Y_SIZE) {
//         // const v = (Math.sin(x / 20) * Math.cos(x / 32) * height) / 4 + height / 2
//         // const v =
//         //   Math.abs(
//         //     noise.simplex2(x / (width / 3), time) * height +
//         //       0.5 * noise.simplex2(x / 1 + 100, time) * 3
//         //   ) /
//         //     4 +
//         //   height / 2;
//         const lowWave = Math.abs(
//           noise.simplex2(x / (width / 3), time / 2) * height + height / 2
//         );
//         const hiWave = Math.abs(
//           noise.simplex2(x / (width / 30), time) * height + height / 2
//         );
//         const v = hiWave / 2 + lowWave;
//         if (y > v) {
//           context.fillStyle = colors[0];
//           context.fillRect(x, y, X_SIZE, Y_SIZE);
//         } else if (y > v - Y_SIZE * 2) {
//           context.fillStyle = colors[1];
//           context.fillRect(x, y, X_SIZE, Y_SIZE);
//         } else if (y > v - Y_SIZE * 8) {
//           context.fillStyle = colors[2];
//           context.fillRect(x, y, X_SIZE, Y_SIZE);
//         } else if (y > v - Y_SIZE * 18) {
//           context.fillStyle = colors[3];
//           context.fillRect(x, y, X_SIZE, Y_SIZE);
//         }
//       }
