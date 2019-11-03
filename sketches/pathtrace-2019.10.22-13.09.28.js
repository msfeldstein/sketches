const canvasSketch = require("canvas-sketch");
global.THREE = require("three");
require("three/examples/js/controls/OrbitControls");
require("three/examples/js/loaders/RGBELoader");
require("./RayTracingRenderer");

const settings = {
  // Make the loop animated
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: "webgl",
  // Turn on MSAA
  attributes: { antialias: true }
};

const sketch = async ({ context }) => {
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
  const envMap = await load(THREE.RGBELoader, "envmap.hdr");
  console.log(envMap);
  const envLight = new THREE.EnvironmentLight(envMap); // create an Environment Light from the hdr texture
  scene.add(envLight);

  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({
      color: "white",
      roughness: 0.75,
      flatShading: true
    })
  );
  scene.add(mesh);

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
      mesh.rotation.y = time * ((10 * Math.PI) / 180);
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

function load(loader, url) {
  return new Promise(resolve => {
    const l = new loader();
    console.log(l);
    l.load(url, resolve, undefined, exception => {
      throw exception;
    });
  });
}
