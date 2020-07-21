const canvasSketch = require("canvas-sketch");
global.THREE = require("three");
const ZERO = new THREE.Vector3();
const MatcapMaterial = require("three-matcap-material")(THREE);
require("three/examples/js/loaders/GLTFLoader.js");
const settings = {
  // Make the loop animated
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: "webgl",
  // Turn on MSAA
  attributes: { antialias: true },
};

const sketch = ({ context, canvas }) => {
  // Create a renderer
  const renderer = new THREE.WebGLRenderer({
    context,
  });
  renderer.setClearColor("#000");

  // Setup a camera
  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
  camera.position.set(0, 4, 0);
  camera.lookAt(ZERO);
  const scene = new THREE.Scene();

  const touchPads = [];

  var cubeLoader = new THREE.CubeTextureLoader();
  cubeLoader.setPath("/envmap-pisa/");
  var textureCube = cubeLoader.load([
    "px.png",
    "nx.png",
    "py.png",
    "ny.png",
    "pz.png",
    "nz.png",
  ]);

  const loader = new THREE.GLTFLoader();
  let gltfScene;
  loader.load("./hangdrum.glb", (gltf) => {
    var material = new MatcapMaterial();
    gltfScene = gltf.scene;
    gltf.scene.traverse((o) => {
      if (o.name.indexOf("Pad") !== -1) {
        o.material = new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
        });

        touchPads.push(o);
      } else if (o.material) {
        o.material.envMap = textureCube;
        o.material.envMapIntensity = 6;
      }
    });
    scene.add(gltf.scene);
  });

  // Specify an ambient/unlit colour
  scene.add(new THREE.AmbientLight("#59314f"));

  // Add some light
  const light = new THREE.PointLight("#45caf7", 1, 15.5);
  light.position.set(2, 2, -4).multiplyScalar(1.5);
  scene.add(light);

  var raycaster = new THREE.Raycaster();
  var mouse = new THREE.Vector2();

  window.addEventListener("mousemove", () => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    if (gltfScene)
      gltfScene.rotation.setFromVector3(
        new THREE.Vector3(mouse.y / 4, 0, mouse.x / 4)
      );
  });
  canvas.addEventListener("click", () => {
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(touchPads);
    if (intersects[0]) {
      console.log(intersects[0].object.name);
    }
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
