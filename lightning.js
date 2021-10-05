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

let seed = Math.random();
const LIGHTNING_TIME = 8;
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
        const fbmX = (x / 12 / X_SIZE) * 0.35;
        const fbmY = (y / 12 / Y_SIZE) * 0.35;
        const n = noise.simplex2(coordX, coordY);
        const noise1 = n * 0.5 + 0.5;
        const n2 = noise.simplex2(coordX, coordY);
        const noise2 = n2 * 0.5 + 0.5;
        const combined = (noise1 + noise2) * 0.5;

        const fbmNoise =
          1.0 -
          3 * Math.pow(Math.abs(fbm(fbmX + seed, fbmY / 3 + seed) - 0.5), 0.5);
        const fadeFbmNoise = overlay(fbmNoise, 1 - yNorm);
        // const value = (combined - 2 + time * 100) * fbmNoise;
        const fadeValue = Math.max(0, 1 - Math.abs(time * LIGHTNING_TIME - 1));
        let value = fbmNoise * Math.max(0, 1 - yNorm * 2 - 1 + fadeValue * 2);
        let nonFadedValue = fbmNoise * Math.max(0, 1 - yNorm * 2 - 1 + 1 * 2);
        if (time > 1 / (LIGHTNING_TIME / 2)) {
          // value = 0.5 - nonFadedValue;
        }
        const percent = value * 100;
        context.fillStyle = `hsl(60.0, 100%, ${percent}%)`;
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
