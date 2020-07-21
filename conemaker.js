const canvasSketch = require("canvas-sketch");
const dat = require("dat.gui");

// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require("three");
require("three/examples/js/exporters/OBJExporter");
require("three/examples/js/exporters/GLTFExporter");
require("three/examples/js/utils/BufferGeometryUtils");

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

  const scene = new THREE.Scene();

  var topGeometry = new THREE.ConeBufferGeometry(1, 1, 32);
  var topMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
  const topCone = new THREE.Mesh(topGeometry, topMaterial);
  const topPivot = new THREE.Object3D();
  topPivot.add(topCone);
  topCone.position.set(0, 0.5, 0);
  scene.add(topPivot);

  var bottomGeometry = new THREE.ConeBufferGeometry(1, 1, 32);
  var bottomMaterial = new THREE.MeshStandardMaterial({
    color: 0xffff00,
    flatShading: false,
  });
  THREE.BufferGeometryUtils.mergeVertices(bottomGeometry);
  bottomGeometry.computeVertexNormals();
  const bottomCone = new THREE.Mesh(bottomGeometry, bottomMaterial);
  const bottomPivot = new THREE.Object3D();
  bottomPivot.add(bottomCone);
  scene.add(bottomPivot);
  bottomCone.position.set(0, 0.5, 0);
  bottomPivot.rotation.set(Math.PI, 0, 0);

  scene.add(new THREE.AmbientLight(0x333));

  // Add some light
  const light = new THREE.PointLight("#ffffff", 5, 15.5);
  light.position.set(2, 2, -4).multiplyScalar(1.5);
  scene.add(light);

  const downloadObj = () => {
    const exporter = new THREE.OBJExporter();
    const obj = exporter.parse(scene);
    const blob = new Blob([obj], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    document.body.appendChild(a);
    a.download = "tris.obj";
    a.click();
    console.log(obj);
  };

  const downloadGltf = () => {
    const exporter = new THREE.GLTFExporter();
    const obj = exporter.parse(
      scene,
      (gltf) => {
        const blob = new Blob([gltf], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        document.body.appendChild(a);
        a.download = "tris.glb";
        a.click();
        console.log(obj);
      },
      {
        binary: true,
      }
    );
  };

  const gui = new dat.GUI();
  const opts = {
    topSize: 2,
    topColor: "#FF0000",
    bottomSize: 1,
    bottomColor: "#FFFFFF",
    spacing: 0.3,
    downloadObj,
    downloadGltf,
  };
  topPivot.scale.setY(opts.topSize);
  topMaterial.color.set(opts.topColor);
  bottomPivot.scale.setY(opts.bottomSize);
  bottomMaterial.color.set(opts.bottomColor);
  topPivot.position.setY(opts.spacing);
  gui.add(opts, "topSize", 0, 5).onChange((v) => {
    topPivot.scale.setY(v);
  });
  gui.addColor(opts, "topColor").onChange((v) => {
    topMaterial.color.set(v);
  });

  gui.add(opts, "bottomSize", 0, 5).onChange((v) => {
    bottomPivot.scale.setY(v);
  });
  gui.addColor(opts, "bottomColor").onChange((v) => {
    bottomMaterial.color.set(v);
  });
  gui.add(opts, "spacing", 0, 1).onChange((v) => {
    topPivot.position.setY(v);
  });

  gui.add(opts, "downloadObj");
  gui.add(opts, "downloadGltf");

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
