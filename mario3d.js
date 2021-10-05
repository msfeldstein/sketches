// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require("three");

require("three/examples/js/loaders/GLTFLoader");

// Include any additional ThreeJS examples below
require("three/examples/js/controls/OrbitControls");

const canvasSketch = require("canvas-sketch");

const settings = {
  // Make the loop animated
  animate: true,
  alpha: true,
  // Get a WebGL canvas rather than 2D
  context: "webgl",
  dimensions: [300, 300],
};

const sketch = ({ canvas, context }) => {
  // Create a renderer
  const renderer = new THREE.WebGLRenderer({
    canvas: context.canvas,
  });

  // WebGL background color
  renderer.setClearColor("#000", 0);

  // Setup a camera
  const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 10000);
  camera.position.set(0, 0, -4);
  camera.lookAt(new THREE.Vector3());

  // Setup camera controller
  // const controls = new THREE.OrbitControls(camera, context.canvas);

  // Setup your scene
  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xcccccc));
  const light = new THREE.DirectionalLight(0xcccccc);

  light.position.set(-100, 100, 100);
  scene.add(light);

  const loader = new THREE.GLTFLoader();
  loader.load("./mario/scene.gltf", (gltf) => {
    console.log(gltf);
    scene.add(gltf.scene);
  });

  const mouse = new THREE.Vector2();
  window.addEventListener("mousemove", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    console.log(mouse);
  });
  const img = new Image();
  img.src = "./mario/metamask.png";
  document.body.appendChild(img);
  canvas.style.position = "fixed";
  canvas.style.top = "20%";

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
      // controls.update();
      camera.position.set(-mouse.x * 4, -mouse.y * 4, 12);
      camera.lookAt(scene.position);
      renderer.render(scene, camera);
    },
    // Dispose of events & renderer for cleaner hot-reloading
    unload() {
      // controls.dispose();
      renderer.dispose();
    },
  };
};

canvasSketch(sketch, settings);
