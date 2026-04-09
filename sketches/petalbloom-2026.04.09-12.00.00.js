const canvasSketch = require("canvas-sketch");
const noise = require("../perlin").noise;

const settings = {
  dimensions: [2048, 2048],
  animate: true,
};

const palettes = [
  ["#FF6B6B", "#FEC89A", "#FFD93D", "#6BCB77", "#4D96FF"],
  ["#E8A0BF", "#BA90C6", "#C0DBEA", "#FFF8E1"],
  ["#F94C10", "#F8DE22", "#C70039", "#900C3F", "#581845"],
  ["#00B4D8", "#0077B6", "#023E8A", "#CAF0F8", "#90E0EF"],
];

const sketch = ({ width, height }) => {
  const cx = width / 2;
  const cy = height / 2;
  const palette = palettes[Math.floor(Math.random() * palettes.length)];
  const numLayers = 5 + Math.floor(Math.random() * 4);
  const symmetry = 5 + Math.floor(Math.random() * 8);
  const seedOffset = Math.random() * 1000;

  const flowers = [];
  for (let i = 0; i < 3 + Math.floor(Math.random() * 4); i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * width * 0.25;
    flowers.push({
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      scale: 0.4 + Math.random() * 0.6,
      rotation: Math.random() * Math.PI * 2,
      symmetry: symmetry + Math.floor(Math.random() * 3) - 1,
      layers: numLayers + Math.floor(Math.random() * 3) - 1,
      palette: palettes[Math.floor(Math.random() * palettes.length)],
      seed: Math.random() * 1000,
    });
  }

  return ({ context, width, height, time }) => {
    context.fillStyle = "#0a0a0f";
    context.fillRect(0, 0, width, height);

    flowers.forEach((flower) => {
      drawFlower(context, flower, width, time);
    });

    drawParticles(context, width, height, time, seedOffset);
  };
};

function drawFlower(context, flower, canvasSize, time) {
  const { x, y, scale, rotation, symmetry, layers, palette, seed } = flower;
  const maxRadius = canvasSize * 0.28 * scale;

  for (let layer = layers; layer >= 0; layer--) {
    const layerT = layer / layers;
    const radius = maxRadius * (0.2 + layerT * 0.8);
    const colorIdx = layer % palette.length;
    const alpha = 0.15 + layerT * 0.4;

    context.save();
    context.translate(x, y);
    context.rotate(rotation + layer * 0.1 + time * 0.15);

    for (let i = 0; i < symmetry; i++) {
      const angle = (i / symmetry) * Math.PI * 2;
      drawPetal(context, angle, radius, layerT, palette[colorIdx], alpha, time, seed + layer);
    }

    context.restore();
  }

  drawCenter(context, x, y, maxRadius * 0.12, palette, time, seed);
}

function drawPetal(context, angle, radius, layerT, color, alpha, time, seed) {
  const steps = 60;
  const petalWidth = 0.35 + layerT * 0.15;

  context.beginPath();

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const r = radius * t;

    const noiseVal = noise.simplex3(
      Math.cos(angle) * 2 + seed,
      Math.sin(angle) * 2 + seed,
      t * 3 + time * 0.3
    );

    const widthAtT = Math.sin(t * Math.PI) * petalWidth * radius * 0.3;
    const wobble = noiseVal * radius * 0.08;

    const px = Math.cos(angle) * (r + wobble);
    const py = Math.sin(angle) * (r + wobble);

    const perpX = -Math.sin(angle);
    const perpY = Math.cos(angle);

    if (i === 0) {
      context.moveTo(px, py);
    } else {
      context.lineTo(px + perpX * widthAtT, py + perpY * widthAtT);
    }
  }

  for (let i = steps; i >= 0; i--) {
    const t = i / steps;
    const r = radius * t;

    const noiseVal = noise.simplex3(
      Math.cos(angle) * 2 + seed + 100,
      Math.sin(angle) * 2 + seed + 100,
      t * 3 + time * 0.3
    );

    const widthAtT = Math.sin(t * Math.PI) * petalWidth * radius * 0.3;
    const wobble = noiseVal * radius * 0.08;

    const px = Math.cos(angle) * (r + wobble);
    const py = Math.sin(angle) * (r + wobble);

    const perpX = -Math.sin(angle);
    const perpY = Math.cos(angle);

    context.lineTo(px - perpX * widthAtT, py - perpY * widthAtT);
  }

  context.closePath();

  const gradient = context.createRadialGradient(0, 0, 0, 0, 0, radius);
  gradient.addColorStop(0, hexToRgba(color, alpha * 0.5));
  gradient.addColorStop(0.5, hexToRgba(color, alpha));
  gradient.addColorStop(1, hexToRgba(color, alpha * 0.3));

  context.fillStyle = gradient;
  context.fill();

  context.strokeStyle = hexToRgba(color, alpha * 0.6);
  context.lineWidth = 1.5;
  context.stroke();
}

function drawCenter(context, x, y, radius, palette, time, seed) {
  const rings = 4;
  for (let i = rings; i >= 0; i--) {
    const t = i / rings;
    const r = radius * (0.3 + t * 0.7);
    const noiseVal = noise.simplex3(seed, t * 5, time * 0.5);
    const wobbleR = r + noiseVal * radius * 0.15;

    context.beginPath();
    context.arc(x, y, wobbleR, 0, Math.PI * 2);

    const color = palette[i % palette.length];
    const gradient = context.createRadialGradient(x, y, 0, x, y, wobbleR);
    gradient.addColorStop(0, hexToRgba(color, 0.9));
    gradient.addColorStop(1, hexToRgba(color, 0.3));

    context.fillStyle = gradient;
    context.fill();
  }
}

function drawParticles(context, width, height, time, seedOffset) {
  const cx = width / 2;
  const cy = height / 2;
  const numParticles = 200;

  for (let i = 0; i < numParticles; i++) {
    const baseAngle = (i / numParticles) * Math.PI * 2;
    const baseDist = 100 + (i * width * 0.4) / numParticles;

    const nx = noise.simplex3(i * 0.1 + seedOffset, time * 0.2, 0);
    const ny = noise.simplex3(0, i * 0.1 + seedOffset, time * 0.2);

    const px = cx + Math.cos(baseAngle + time * 0.05) * baseDist + nx * 80;
    const py = cy + Math.sin(baseAngle + time * 0.05) * baseDist + ny * 80;

    const size = 1 + noise.simplex2(i * 0.5, time * 0.3) * 2;
    const alpha = 0.2 + noise.simplex2(i * 0.3, time * 0.5) * 0.3;

    if (size > 0 && alpha > 0) {
      context.beginPath();
      context.arc(px, py, Math.abs(size), 0, Math.PI * 2);
      context.fillStyle = `rgba(255, 255, 255, ${Math.abs(alpha)})`;
      context.fill();
    }
  }
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

canvasSketch(sketch, settings);
