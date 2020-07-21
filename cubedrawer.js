const canvasSketch = require("canvas-sketch");

// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require("three");
function save(blob, filename) {
  var link = document.createElement("a");
  link.style.display = "none";
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();

  // URL.revokeObjectURL( url ); breaks Firefox...
}

function saveString(text, filename) {
  save(new Blob([text], { type: "text/plain" }), filename);
}

function saveArrayBuffer(buffer, filename) {
  save(new Blob([buffer], { type: "application/octet-stream" }), filename);
}
// Include any additional ThreeJS examples below
require("three/examples/js/controls/OrbitControls");
require("three/examples/js/exporters/GLTFExporter");
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
  const camera = new THREE.PerspectiveCamera(25, 1, 0.01, 100);
  camera.position.set(-1, -3, -2);
  camera.lookAt(new THREE.Vector3());

  // Setup camera controller
  const controls = new THREE.OrbitControls(camera, context.canvas);

  // Setup your scene
  const scene = new THREE.Scene();
  const empty = new THREE.Object3D();
  scene.add(empty);
  empty.position.set(-0.5, -0.5, 0);
  const mat = new THREE.MeshPhysicalMaterial({
    roughness: 0.75,
    flatShading: true,
    color: "white",
  });

  const addCube = (x, y, s, zSize) => {
    const mesh = new THREE.Mesh(new THREE.BoxBufferGeometry(s, s, zSize), mat);
    mesh.position.set(x + s / 2, y + s / 2, -zSize / 2);
    empty.add(mesh);
  };

  const addArc = (x, y, s, zSize) => {
    const shapes = [
      { thetaStart: 0, xOff: 0, yOff: s },
      { thetaStart: Math.PI / 2, xOff: 0, yOff: 0 },
      { thetaStart: Math.PI, xOff: s, yOff: 0 },
      { thetaStart: (Math.PI * 3) / 2, xOff: s, yOff: s },
    ];
    const shape = shapes[Math.floor(shapes.length * Math.random())];
    const geom = new THREE.CylinderGeometry(
      s,
      s,
      zSize,
      32,
      1,
      false,
      shape.thetaStart,
      Math.PI / 2
    );
    geom.faces.push(
      new THREE.Face3(0, 67, 33),
      new THREE.Face3(0, 66, 67),
      new THREE.Face3(66, 65, 67),
      new THREE.Face3(66, 32, 65)
    );
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x + shape.xOff, y + shape.yOff, -zSize / 2);
    mesh.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);
    empty.add(mesh);
  };

  const addCyl = (x, y, s, zSize) => {
    const mesh = new THREE.Mesh(
      new THREE.CylinderBufferGeometry(
        s / 2,
        s / 2,
        zSize,
        32,
        1,
        false,
        0,
        Math.PI * 2
      ),
      mat
    );
    mesh.position.set(x + s / 2, y + s / 2, -zSize / 2);
    mesh.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);
    empty.add(mesh);
  };
  const doSquare = (x, y, s) => {
    const shouldSplit = Math.random() < s * 5;
    if (shouldSplit) {
      const hs = s / 2;
      doSquare(x, y, hs);
      doSquare(x + hs, y, hs);
      doSquare(x, y + hs, hs);
      doSquare(x + hs, y + hs, hs);
    } else {
      const zSize = 0.1 + 0.1 * Math.random();
      const shapes = [addCube];
      const shape = shapes[Math.floor(shapes.length * Math.random())];
      shape(x, y, s, zSize);
    }
  };

  doSquare(0, 0, 1);
  var axesHelper = new THREE.AxesHelper(5);
  scene.add(axesHelper);
  const gltfExporter = new THREE.GLTFExporter();
  var options = {
    // trs: document.getElementById( 'option_trs' ).checked,
    // onlyVisible: document.getElementById( 'option_visible' ).checked,
    // truncateDrawRange: document.getElementById( 'option_drawrange' ).checked,
    binary: true,
    // forceIndices: document.getElementById( 'option_forceindices' ).checked,
    // forcePowerOfTwoTextures: document.getElementById( 'option_forcepot' ).checked,
    // maxTextureSize: Number( document.getElementById( 'option_maxsize' ).value ) || Infinity // To prevent NaN value
  };
  // gltfExporter.parse(
  //   empty,
  //   function (result) {
  //     if (result instanceof ArrayBuffer) {
  //       saveArrayBuffer(result, "scene.glb");
  //     } else {
  //       var output = JSON.stringify(result, null, 2);
  //       console.log(output);
  //       saveString(output, "scene.gltf");
  //     }
  //   },
  //   options
  // );

  // Specify an ambient/unlit colour
  scene.add(new THREE.AmbientLight("#59314f"));

  // Add some light
  const light = new THREE.PointLight("#45caf7", 3, 15.5);
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
    },
  };
};

canvasSketch(sketch, settings);
