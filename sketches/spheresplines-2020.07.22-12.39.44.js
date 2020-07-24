const canvasSketch = require("canvas-sketch");
const download = require("three-gltf-downloader");
// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require("three");

// Include any additional ThreeJS examples below
require("three/examples/js/controls/OrbitControls");

const settings = {
  // Make the loop animated
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: "webgl",
  // Turn on MSAA
  attributes: { antialias: true },
};

const sketch = ({ context }) => {
  // Create a renderer
  const renderer = new THREE.WebGLRenderer({
    context,
  });

  // WebGL background color
  renderer.setClearColor("#000", 1);

  // Setup a camera
  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
  camera.position.set(2, 2, -4);
  camera.lookAt(new THREE.Vector3());

  // Setup camera controller
  const controls = new THREE.OrbitControls(camera, context.canvas);

  // Setup your scene
  const scene = new THREE.Scene();
  const count = 120;

  for (var i = 0; i < count; i++) {
    const theta = (i * Math.PI) / count;
    const r = Math.sin(theta);
    if (Math.random() * r < 0.3) continue;
    if (r == 0) continue;
    var curve = new THREE.EllipseCurve(
      0,
      0,
      r,
      r,
      Math.PI + Math.random(),
      2 * Math.PI - Math.random()
    );
    var path = new THREE.Curve();
    path.getPoint = function (t) {
      var v2 = curve.getPoint(t);
      return new THREE.Vector3(v2.x, v2.y, 0);
    };
    var geometry = new THREE.TubeBufferGeometry(path, 20, 0.01, 8, false);
    var material = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      side: THREE.DoubleSide,
    });
    var mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    mesh.position.setZ(Math.cos(theta));
  }
  // Specify an ambient/unlit colour
  scene.add(new THREE.AmbientLight("#59314f"));

  // Add some light
  const light = new THREE.PointLight("#45caf7", 1, 15.5);
  light.position.set(2, 2, -4).multiplyScalar(1.5);
  scene.add(light);

  window.addEventListener("keydown", (e) => {
    if (e.key === "s") download(scene);
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
