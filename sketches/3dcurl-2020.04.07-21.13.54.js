const canvasSketch = require("canvas-sketch");
const noise = require("../perlin").noise;
// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require("three");

// Include any additional ThreeJS examples below
require("three/examples/js/controls/OrbitControls");

const f = (x, y, z) => noise.simplex3(x * 10, y * 10, z * 10);
function computeCurl(f, x, y, z) {
  var eps = 0.0001;

  var curl = new THREE.Vector3();

  //Find rate of change in YZ plane
  var n1 = f(x, y + eps, z);
  var n2 = f(x, y - eps, z);
  //Average to find approximate derivative
  var a = (n1 - n2) / (2 * eps);
  var n1 = f(x, y, z + eps);
  var n2 = f(x, y, z - eps);
  //Average to find approximate derivative
  var b = (n1 - n2) / (2 * eps);
  curl.x = a - b;

  //Find rate of change in XZ plane
  n1 = f(x, y, z + eps);
  n2 = f(x, y, z - eps);
  a = (n1 - n2) / (2 * eps);
  n1 = f(x + eps, y, z);
  n2 = f(x + eps, y, z);
  b = (n1 - n2) / (2 * eps);
  curl.y = a - b;

  //Find rate of change in XY plane
  n1 = f(x + eps, y, z);
  n2 = f(x - eps, y, z);
  a = (n1 - n2) / (2 * eps);
  n1 = f(x, y + eps, z);
  n2 = f(x, y - eps, z);
  b = (n1 - n2) / (2 * eps);
  curl.z = a - b;

  return curl;
}

const settings = {
  // Make the loop animated
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: "webgl",

  // Turn on MSAA
  attributes: { antialias: true, preserveDrawingBuffer: true },
};

const sketch = ({ context }) => {
  // Create a renderer
  console.log(context);
  const renderer = new THREE.WebGLRenderer({
    context,
    preserveDrawingBuffer: true,
  });

  renderer.autoClearColor = false;
  renderer.autoClear = false;
  renderer.clear();

  // Setup a camera
  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
  camera.position.set(1, 1, -2);
  camera.lookAt(new THREE.Vector3());
  const scene = new THREE.Scene();

  // Setup camera controller
  const controls = new THREE.OrbitControls(camera, context.canvas);

  const vertices = new THREE.IcosahedronGeometry(0.1, 1).vertices;

  const positions = new Float32Array(vertices.length * 3);
  vertices.forEach((v, i) => v.toArray(positions, i * 3));
  const geometry = new THREE.BufferGeometry();
  const positionAttribute = new THREE.BufferAttribute(positions, 3);
  geometry.setAttribute("position", positionAttribute);
  const material = new THREE.PointsMaterial({ color: "red", size: 0.01 });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);
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
      renderer.autoClear = false;
      renderer.autoClearColor = false;
    },
    // Update & render your scene here
    render({ time }) {
      for (var i = 0; i < positions.length; i += 3) {
        const [x, y, z] = positions.slice(i, i + 3);
        const curl = computeCurl(f, x, y, z);
        curl.multiplyScalar(0.0001);
        positions[i] += curl.x;
        positions[i + 1] += curl.y;
        positions[i + 2] += curl.z;
      }
      positionAttribute.needsUpdate = true;
      // controls.update();
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
