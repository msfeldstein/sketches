const canvasSketch = require("canvas-sketch");
const GRID_SIZE = 0.4;
const PADDING = 0.03;

// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require("three");

// Include any additional ThreeJS examples below
require("three/examples/js/controls/OrbitControls");

const gridColumns = 80;
const gridRows = 12;

const cells = [];

for (var y = 0; y < gridRows; y++) {
  const row = [];
  for (var x = 0; x < gridColumns; x++) {
    row.push("0");
  }
  cells.push(row);
}
console.log(cells);
var str = "";
cells.forEach(row => {
  row.forEach(char => {
    str += char;
  });
  str += "\n";
});
console.log(str);

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
  const renderer = new THREE.WebGLRenderer({
    context
  });

  // WebGL background color
  renderer.setClearColor("#000", 1);

  // Setup a camera
  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
  camera.position.set(0, 0, -4);
  camera.lookAt(new THREE.Vector3());

  // Setup camera controller
  const controls = new THREE.OrbitControls(camera, context.canvas);

  // Setup your scene
  const scene = new THREE.Scene();

  for (var x = -2; x <= 2; x += GRID_SIZE + PADDING) {
    for (var y = -1; y <= 1; y += GRID_SIZE + PADDING) {
      if (Math.random() < 0.3) continue;
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(GRID_SIZE, GRID_SIZE, 0.03),
        new THREE.MeshPhysicalMaterial({
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
    }
  };
};

canvasSketch(sketch, settings);
