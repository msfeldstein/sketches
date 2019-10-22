const canvasSketch = require("canvas-sketch");

// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require("three");

// Include any additional ThreeJS examples below
require("three/examples/js/controls/OrbitControls");
require("three/examples/js/exporters/GLTFExporter");

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
  camera.position.set(2, 2, -4);
  camera.lookAt(new THREE.Vector3());

  // Setup camera controller
  const controls = new THREE.OrbitControls(camera, context.canvas);

  // Setup your scene
  const scene = new THREE.Scene();
  const BOX_SIZE = 0.02;
  const empty = new THREE.Object3D();
  var singleGeometry = new THREE.Geometry();
  for (var x = -2; x <= 2; x += BOX_SIZE) {
    for (var z = -2; z <= 2; z += BOX_SIZE) {
      const size = BOX_SIZE + Math.random();
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(BOX_SIZE, size, BOX_SIZE),
        new THREE.MeshPhysicalMaterial({
          color: "white",
          roughness: 0.75,
          flatShading: true
        })
      );

      mesh.position.x = x;
      mesh.position.set(x, 0, z);
      mesh.updateMatrix();
      singleGeometry.merge(mesh.geometry, mesh.matrix);
    }
  }
  const mesh = new THREE.Mesh(singleGeometry, new THREE.MeshBasicMaterial());
  scene.add(mesh);
  var exporter = new THREE.GLTFExporter();
  const options = {
    binary: false
  };

  // Parse the input and generate the glTF output
  exporter.parse(
    scene,
    function(gltf) {
      console.log(gltf);
      window.gltf = gltf;
      download(JSON.stringify(gltf), "greeble.gltf");
    },
    options
  );
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
function download(filename, text) {
  var element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(text)
  );
  element.setAttribute("download", filename);

  element.style.display = "none";
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}
