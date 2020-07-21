const canvasSketch = require("canvas-sketch");
const { MeshLine, MeshLineMaterial } = require("three.meshline");
console.log(MeshLine);
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
  {
    const mesh = new THREE.Mesh(
      new THREE.SphereBufferGeometry(1, 32, 32),
      new THREE.MeshPhysicalMaterial({
        color: "white",
        roughness: 0.75,
      })
    );
    scene.add(mesh);
  }
  var mlMat = new MeshLineMaterial({
    transparent: true,
    opacity: 0.1,
  });
  for (var i = 0; i < 10; i++) {
    var curve = new THREE.EllipseCurve(
      0,
      0, // ax, aY
      1,
      1, // xRadius, yRadius
      0,
      2 * Math.PI, // aStartAngle, aEndAngle
      false, // aClockwise
      0 // aRotation
    );

    var points = curve.getPoints(50);
    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    var line = new MeshLine();
    line.setGeometry(geometry);

    // Create the final object to add to the scene
    var mesh = new THREE.Mesh(line.geometry, material); // this syntax could definitely be improved!
    scene.add(mesh);
    mesh.position.set(0, -1 + Math.random() * 0.1, 0);
  }
  var material = new THREE.LineBasicMaterial({
    color: 0xff0000,
    alphaTest: false,
    opacity: 0.05,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    transparent: true,
  });
  for (var i = 0; i < 10000; i++) {
    var a = Math.random() * 2 * Math.PI;
    var curve = new THREE.EllipseCurve(
      0,
      0, // ax, aY
      0.7 + 0.1 * Math.random(),
      0.7 + 0.1 * Math.random(), // xRadius, yRadius
      a,
      a + Math.random(), // aStartAngle, aEndAngle
      false, // aClockwise
      0 // aRotation
    );

    var points = curve.getPoints(50);
    var geometry = new THREE.BufferGeometry().setFromPoints(points);

    // Create the final object to add to the scene
    var ellipse = new THREE.Line(geometry, material);
    ellipse.position.set(0, 1 - Math.random() * 0.1, 0);
    ellipse.scale.set(1, 0.7, 1);
    ellipse.setRotationFromAxisAngle(
      new THREE.Vector3(Math.random(), Math.random(), Math.random()),
      Math.random() * 0.1
    );
    scene.add(ellipse);
  }

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
      mesh.rotation.y = time * ((10 * Math.PI) / 180);
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
