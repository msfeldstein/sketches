const canvasSketch = require("canvas-sketch");
const script = document.createElement("script");
script.src = "sketches/inflate.min.js";
document.body.appendChild(script);
// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require("three");

// Include any additional ThreeJS examples below
require("three/examples/js/controls/OrbitControls");
require("three/examples/js/loaders/GLTFLoader");
require("three/examples/js/loaders/FBXLoader");
console.log(THREE.GLTFLoader);
const settings = {
  // Make the loop animated
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: "webgl",
  // Turn on MSAA
  attributes: { antialias: true }
};

const NUM_COPIES = 90;
const sketch = ({ context }) => {
  // Create a renderer
  const renderer = new THREE.WebGLRenderer({
    context
  });
  // Setup your scene
  let scene = new THREE.Scene();
  const loader = new THREE.GLTFLoader();
  let mixer;
  const mat = new THREE.MeshPhysicalMaterial();
  const loadModelWithFrame = frame => {
    loader.load("sketches/assets/phoenix_bird/scene.gltf", gltf => {
      const model = gltf.scene;
      scene.add(model);
      model.traverse(node => {
        if (node.material) {
          node.material.map = null;
          node.material.alphaMap = null;
        }
        node.material ? (node.material.map = null) : null;
      });
      model.position.x = -2 + (frame / NUM_COPIES) * 4;
      model.scale.set(0.001, 0.001, 0.001);
      mixer = new THREE.AnimationMixer(model);
      // console.log(mixer);
      // console.log(gltf);
      mixer.clipAction(gltf.animations[0]).play();
      mixer.update(frame / 30);
    });
  };
  for (var i = 0; i < NUM_COPIES; i++) {
    loadModelWithFrame(i);
  }

  // WebGL background color
  renderer.setClearColor("#ccc", 1);

  // Setup a camera
  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
  camera.position.set(2, 2, -4);
  camera.lookAt(new THREE.Vector3());

  // Setup camera controller
  const controls = new THREE.OrbitControls(camera, context.canvas);

  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshPhysicalMaterial({
      color: "white",
      roughness: 0.75,
      flatShading: true
    })
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
    render({ time, deltaTime }) {
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
