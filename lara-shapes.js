// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require("three");

// Include any additional ThreeJS examples below
require("three/examples/js/controls/OrbitControls");
require("three/examples/js/exporters/GLTFExporter");

const canvasSketch = require("canvas-sketch");
const { Mesh } = require("three");

const settings = {
  // Make the loop animated
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: "webgl",
};

const background = "rgb(131,213,187)";

const GRID_NOISE = 4;
const GRID_SPACING = 3.5;
const width = 20;
const height = 20;

const colors = [
  "rgb(130,68,127)", // purple
  "rgb(175,121,83)", // gold
  "rgb(242,162,159)", // pink
  "rgb(228,197,155	)", // yellow
];

const randomColor = () => {
  return colors[Math.floor(colors.length * Math.random())];
};

const sketch = ({ context }) => {
  // Create a renderer
  const renderer = new THREE.WebGLRenderer({
    canvas: context.canvas,
  });

  renderer.setClearColor(background, 1);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 1000);
  camera.position.set(0, 0, -10);
  camera.lookAt(new THREE.Vector3());
  const controls = new THREE.OrbitControls(camera, context.canvas);

  const scene = new THREE.Scene();

  const drawShape = (x, y, z, w, h, rotation, color) => {
    const slope = h / 2;
    const geo = new THREE.BoxBufferGeometry(w, h, 0.3);
    const mat = new THREE.MeshStandardMaterial({ emissive: color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.x = x;
    mesh.position.y = y;
    mesh.position.z = z;
    mesh.rotation.z = rotation;

    var Syx = 1,
      Szx = 0,
      Sxy = 0,
      Szy = 0,
      Sxz = 0,
      Syz = 0;

    var matrix = new THREE.Matrix4();

    matrix.set(1, Syx, Szx, 0, Sxy, 1, Szy, 0, Sxz, Syz, 1, 0, 0, 0, 0, 1);
    mesh.geometry.applyMatrix4(matrix);
    scene.add(mesh);
  };

  for (x = -GRID_SPACING / 2; x < width; x += GRID_SPACING) {
    for (var y = -GRID_SPACING; y < height; y += GRID_SPACING) {
      const h = Math.random() * 4 + 1;
      const w = Math.random() * 5 + 1;

      const color = randomColor();
      const randX = GRID_NOISE * Math.random() - GRID_NOISE / 2;
      const randY = GRID_NOISE * Math.random() - GRID_NOISE / 2;
      drawShape(
        x + randX,
        y + randY,
        Math.random() * 4,
        w,
        h,
        Math.random() > 0.5 ? 0 : Math.PI / 3,
        color
      );
    }
  }

  function save(blob, filename) {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();

    // URL.revokeObjectURL( url ); breaks Firefox...
  }

  function saveArrayBuffer(buffer, filename) {
    save(new Blob([buffer], { type: "application/octet-stream" }), filename);
  }
  window.addEventListener("keydown", (e) => {
    if (e.key == "s") {
      const exporter = new THREE.GLTFExporter();
      exporter.parse(
        scene,
        function (gltf) {
          saveArrayBuffer(gltf, "scene.glb");
        },
        { binary: true }
      );
    }
  });

  // draw each frame
  return {
    // Handle resize events here
    resize({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight, false);
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
