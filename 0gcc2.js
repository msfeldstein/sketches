// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require("three");
const {
  BloomEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
} = require("postprocessing");

// Include any additional ThreeJS examples below
require("three/examples/js/controls/OrbitControls");
require("three/examples/js/loaders/GLTFLoader");
const canvasSketch = require("canvas-sketch");
const { Vector3 } = require("three");

const settings = {
  // Make the loop animated
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: "webgl",
};

const sketch = ({ context, canvas }) => {
  // Create a renderer

  const renderer = new THREE.WebGLRenderer({
    canvas: context.canvas,
  });

  // WebGL background color
  renderer.setClearColor("#000", 1);
  const clock = new THREE.Clock();

  // Setup a camera
  const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 100);
  camera.position.set(0, 0, 8);
  camera.lookAt(new THREE.Vector3());

  // Setup camera controller
  // const controls = new THREE.OrbitControls(camera, context.canvas);

  // Setup your scene
  const scene = new THREE.Scene();
  let mouse = { x: 0, y: 0 };
  const loader = new THREE.GLTFLoader();
  let golfball = null;
  loader.load("golf.glb", (gltf) => {
    scene.add(gltf.scene);
    golfball = gltf.scene.children[2];
    golfball.rotateX(180);
    console.log(golfball.material);
    golfball.material.map = new THREE.TextureLoader().load("ms/guernica.jpeg");
  });
  const light = new THREE.SpotLight("0xffffff", 3, 35, 35);
  light.position.set(0, 0, -20);
  light.lookAt(new THREE.Vector3());
  const helper = new THREE.SpotLightHelper(light);
  // scene.add(helper);
  const empty = new THREE.Object3D();
  scene.add(empty);
  empty.add(light);
  canvas.addEventListen;
  canvas.addEventListener("mousemove", function (e) {
    mouse.x = -(e.clientX / canvas.offsetWidth - 0.5) * 4;
    mouse.y = (e.clientY / canvas.offsetHeight - 0.5) * 4;
  });

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new EffectPass(camera, new BloomEffect({ intensity: 0 })));

  canvas.addEventListener("dragover", function (e) {
    e.preventDefault();
  });

  canvas.addEventListener("drop", function (e) {
    e.preventDefault();
    console.log(e);
    const file = e.dataTransfer.files[0];
    const reader = new FileReader();
    reader.onload = function (event) {
      const img = document.createElement("img");
      img.src = event.target.result;
      const texture = new THREE.Texture(img);
      texture.needsUpdate = true;
      golfball.material.map = texture;
    };
    reader.readAsDataURL(file);
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
      // controls.update();
      if (golfball) {
        // golfball.lookAt(new Vector3(mouse.x, mouse.y, -8));
        golfball.position.y = Math.sin(clock.getElapsedTime()) / 20;
        golfball.rotation.set(0, clock.getElapsedTime() / 30, 0);
      }
      empty.rotation.set(0, -clock.getElapsedTime() / 1.2, 0);
      composer.render(clock.getDelta());
    },
    // Dispose of events & renderer for cleaner hot-reloading
    unload() {
      controls.dispose();
      renderer.dispose();
    },
  };
};

canvasSketch(sketch, settings);
