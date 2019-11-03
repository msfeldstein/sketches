const canvasSketch = require("canvas-sketch");
const GRID_SIZE = 0.4;
const PADDING = 0.03;

// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require("three");

const RayTracingRenderer = require("./RayTracingRenderer").default;
// Include any additional ThreeJS examples below
require("three/examples/js/controls/OrbitControls");
require("three/examples/js/loaders/RGBELoader");
require("./RayTracingRenderer")

const gridColumns = 80;
const gridRows = 12;

const cells = [];
const EMPTY = ".";

for (var y = 0; y < gridRows; y++) {
  const row = [];
  for (var x = 0; x < gridColumns; x++) {
    row.push(EMPTY);
  }
  cells.push(row);
}
const numHoles = () => {
  var num = 0;
  cells.forEach(row => {
    row.forEach(char => {
      if (char == EMPTY) num++;
    });
  });
  return num;
};

const sizes = [
  [3, 2],
  [4, 2],
  [4, 3],
  [5, 3],
  [5, 4],
  [6, 4],
  [6, 4],
  [6, 4],
  [6, 4]
];
let lastCell = 0;
const attemptRandomCell = () => {
  const xi = Math.floor(Math.random() * gridColumns);
  const yi = Math.floor(Math.random() * gridRows);
  const size = sizes[Math.floor(Math.random() * sizes.length)];
  let ok = true;
  for (var x = xi; x < xi + size[0]; x++) {
    for (var y = yi; y < yi + size[1]; y++) {
      if (!cells[y] || !cells[y][x] || cells[y][x] !== EMPTY) {
        ok = false;
        break;
      }
    }
  }
  if (ok) {
    for (var x = xi; x < xi + size[0]; x++) {
      for (var y = yi; y < yi + size[1]; y++) {
        cells[y][x] = lastCell;
      }
    }
    lastCell++;
  }
};
while (numHoles() > 600) {
  attemptRandomCell();
}
const print = () => {
  var str = "";
  cells.forEach(row => {
    row.forEach(char => {
      str += char;
    });
    str += "\n";
  });
  console.log(str);
};
window.more = () => {
  attemptRandomCell();
  print();
};

const settings = {
  // Make the loop animated
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: "webgl",
  // Turn on MSAA
  attributes: { antialias: true }
};

const sketch = ({ context }) => {
  // Create a renderer
  const renderer = new THREE.RayTracingRenderer({
    context
  });
  renderer.toneMapping = THREE.Uncharted2ToneMapping; // a low contrast operator
  renderer.toneMappingExposure = 2; // the higher the number, the brighter the scene

  // WebGL background color

  // Setup a camera
  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
  camera.position.set(0, 0, -4);
  camera.lookAt(new THREE.Vector3());

  // Setup camera controller
  const controls = new THREE.OrbitControls(camera, context.canvas);

  // Setup your scene
  const scene = new THREE.Scene();
  const envMap = new THREE.RGBELoader().load("/sketches/envmap.hdr"); // load the hdr texture
  const envLight = new THREE.EnvironmentLight(envMap); // create an Environment Light from the hdr texture
  scene.add(envLight);

  const dirLight = new THREE.SoftDirectionalLight(0xffffff, 0.5, 0.3); // color, intensity, softness
  dirLight.softness = 0.6; // change softness to 0.6 for a softer shadow

  scene.add(envLight);

  for (var x = -2; x <= 2; x += GRID_SIZE + PADDING) {
    for (var y = -1; y <= 1; y += GRID_SIZE + PADDING) {
      if (Math.random() < 0.3) continue;
      const mesh = new THREE.Mesh(
        new THREE.BoxBufferGeometry(GRID_SIZE, GRID_SIZE, 0.03),
        new THREE.MeshStandardMaterial({
          color: "white",
          roughness: 0.75,
          flatShading: true
        })
      );
      mesh.position.set(x, y, 0);
      scene.add(mesh);
    }
  }

  // Specify an ambient/unlit colour
  scene.add(new THREE.AmbientLight("#59314f"));

  // Add some light
  const light = new THREE.PointLight("#45caf7", 1, 15.5);
  light.position.set(2, 2, -4).multiplyScalar(1.5);
  scene.add(light);
  var loaded = false;
  THREE.DefaultLoadingManager.onLoad = () => {
    loaded = true;
  };
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
      if (!loaded) return;
      controls.update();
      renderer.render(scene, camera);
    },
    // Dispose of events & renderer for cleaner hot-reloading
    unload() {
      controls.dispose();
      renderer.dispose();
    }
  };
};

canvasSketch(sketch, settings);
