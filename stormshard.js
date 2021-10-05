// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require("three");
const { GUI } = require("dat.gui");
const MatcapMaterial = require("three-matcap-material")(THREE);
const {
  BloomEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
  PixelationEffect,
} = require("postprocessing");

// Include any additional ThreeJS examples below
require("three/examples/js/controls/OrbitControls");
require("three/examples/js/loaders/GLTFLoader");
const canvasSketch = require("canvas-sketch");
const { Vector3, OrbitControls } = require("three");

const gui = new GUI();
const opts = {
  hover: true,
  orbitControls: false,
};

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
  renderer.setClearColor("#ccc", 1);
  const clock = new THREE.Clock();

  // Setup a camera
  const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 1000);
  camera.position.set(0, 0, -10);
  camera.lookAt(new THREE.Vector3());

  // Setup camera controller
  // const controls = new THREE.OrbitControls(camera, context.canvas);
  //
  // Setup your scene
  const scene = new THREE.Scene();
  // scene.background = new THREE.TextureLoader().load("./fire.png");
  let mouse = { x: 0, y: 0 };
  const loader = new THREE.GLTFLoader();
  let shard = null;
  loader.load("shard.glb", (gltf) => {
    console.log(gltf);
    scene.add(gltf.scene);
    shard = gltf.scene.children[0];
    // shard.material = new THREE.MeshStandardMaterial({
    //   color: "red",
    //   roughness: 0.3,
    //   metalness: 0,
    // });
    shard.material = new MatcapMaterial();
    // shard.material = new THREE.MeshToonMaterial({ color: "red" });
  });
  const lightLeft = new THREE.PointLight("0xffffff", 1, 100);
  lightLeft.position.set(20, 4, -10);
  lightLeft.lookAt(new THREE.Vector3());
  scene.add(lightLeft);
  const lightRight = new THREE.PointLight("0xffffff", 1, 100);
  lightRight.position.set(-20, 8, -10);
  lightRight.lookAt(new THREE.Vector3());
  // scene.add(lightRight);
  scene.add(new THREE.AmbientLight("0xffffff", 0.1));
  canvas.addEventListen;
  canvas.addEventListener("mousemove", function (e) {
    mouse.x = -(e.clientX / canvas.offsetWidth - 0.5) * 4;
    mouse.y = (e.clientY / canvas.offsetHeight - 0.5) * 4;
  });

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new EffectPass(camera, new PixelationEffect()));

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
      shard.material.map = texture;
    };
    reader.readAsDataURL(file);
  });
  let controls;
  gui.add(opts, "hover");
  gui.add(opts, "orbitControls").onChange(function (v) {
    console.log(v);
    if (v) {
      controls = new OrbitControls(camera, context.canvas);
    } else {
      controls.dispose();
      controls = null;
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
      // controls.update();
      if (shard) {
        shard.rotateY(0.01);
        // shard.position.y = opts.hover
        //   ? Math.sin(clock.getElapsedTime()) / 10
        //   : 0;
      }
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
