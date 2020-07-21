const canvasSketch = require("canvas-sketch");
global.THREE = require("three");
require("three/examples/js/controls/OrbitControls");
require("three/examples/js/exporters/GLTFExporter");
const SimplexNoise = require("simplex-noise");

const noise = new SimplexNoise();

const settings = {
  animate: true,
  context: "webgl",
  attributes: { antialias: true },
};
const s = 0.01;
const rand = (min, max) => {
  return min + Math.random() * (max - min);
};

class Walker {
  constructor(px, py, pz, vx, vy, vz, seed) {
    this.startX = vx;
    this.startY = vy;
    this.startZ = vz;
    this.x = px;
    this.y = py;
    this.z = pz;
    this.vx = vx;
    this.vy = vy;
    this.vz = vz;
    this.seed = seed + rand(-0.05, 0.05);
    this.points = [new THREE.Vector3(this.x, this.y, this.z)];
  }

  update(t) {
    const freq = 0.1;
    this.vx +=
      noise.noise4D(
        this.x * freq,
        this.y * freq,
        this.z * freq,
        1 + this.seed
      ) * 0.01;
    this.vy +=
      noise.noise4D(
        this.x * freq,
        this.y * freq,
        this.z * freq,
        2 + this.seed
      ) * 0.01;
    this.vz +=
      noise.noise4D(
        this.x * freq,
        this.y * freq,
        this.z * freq,
        3 + this.seed
      ) * 0.01;
    this.x += this.vx;
    this.y += this.vy;
    this.z += this.vz;
    this.points.push(new THREE.Vector3(this.x, this.y, this.z));
  }
}

const sketch = ({ context }) => {
  const renderer = new THREE.WebGLRenderer({
    context,
  });
  renderer.setClearColor("#000", 1);
  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
  camera.position.set(2, 2, -4);
  camera.lookAt(new THREE.Vector3());
  const controls = new THREE.OrbitControls(camera, context.canvas);

  const scene = new THREE.Scene();

  // Specify an ambient/unlit colour
  scene.add(new THREE.AmbientLight("#59314f"));

  // Add some light
  const light = new THREE.PointLight("#45caf7", 1, 15.5);
  light.position.set(2, 2, -4).multiplyScalar(1.5);
  scene.add(light);

  const walkers = [];
  console.log("walkers");
  const container = new THREE.Object3D();

  scene.add(container);
  for (var i = 0; i < 5; i++) {
    const vx = rand(-s, s);
    const vy = rand(-s, s);
    const vz = rand(-s, s);
    for (var j = 0; j < 20; j++) {
      walkers.push(new Walker(0, 0, 0, vx, vy, vz, i));
    }
  }
  for (var t = 0; t < 300; t++) {
    walkers.forEach((w) => w.update(t));
  }

  var material = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.5,
  });
  walkers.forEach((w) => {
    var geometry = new THREE.BufferGeometry().setFromPoints(w.points);
    var line = new THREE.Line(geometry, material);
    container.add(line);
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "s") {
      const exporter = new THREE.GLTFExporter();
      const obj = exporter.parse(
        scene,
        (gltf) => {
          const blob = new Blob([gltf], { type: "text/plain" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          document.body.appendChild(a);
          a.download = "lines.glb";
          a.click();
          console.log(obj);
        },
        {
          binary: true,
        }
      );
    }
  });
  // draw each frame
  return {
    // Handle resize events here
    resize({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight);
      camera.aspect = viewportWidth / viewportHeight;
      camera.updateProjectionMatrix();
    },
    // Update & render your scene here
    render({ time }) {
      controls.update();
      renderer.render(scene, camera);
    },
    // Dispose of events & renderer for cleaner hot-reloading
    unload() {
      controls.dispose();
      renderer.dispose();
    },
  };
};

canvasSketch(sketch, settings);
