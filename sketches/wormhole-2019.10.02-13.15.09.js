const canvasSketch = require("canvas-sketch");
const createShader = require("canvas-sketch-util/shader");
const glsl = require("glslify");
global.THREE = require("three");
require("three/examples/js/controls/OrbitControls");
// Setup our sketch
const settings = {
  // Make the loop animated
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: "webgl",
  // Turn on MSAA
  attributes: { antialias: true }
};

// Your glsl code
const frag = glsl(`
  precision highp float;

  uniform float time;
  varying vec2 vUv;

  void main () {
    vec3 color = 0.5 + 0.5 * cos(time + vUv.xyx + vec3(0.0, 2.0, 4.0));
    gl_FragColor = vec4(color, 1.0);
  }
`);

const sketch = ({ context }) => {
  // Create a renderer
  const renderer = new THREE.WebGLRenderer({
    context
  });

  // WebGL background color
  renderer.setClearColor("#000", 1);

  // Setup a camera
  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
  camera.position.set(0, 0, 15);
  camera.lookAt(new THREE.Vector3());

  // Setup camera controller
  const controls = new THREE.OrbitControls(camera);

  // Setup your scene
  const scene = new THREE.Scene();

  const cylGeo = new THREE.CylinderBufferGeometry(1, 1, 6, 8, 16, true);
  const cylVertices = cylGeo.attributes.position.array;
  const cylIdx = cylGeo.index.array;
  var points = [];
  const line = (x1, y1, z1, x2, y2, z2) => {
    points.push(x1, y1, z1, x2, y2, z2);
  };
  const tri = (x1, y1, z1, x2, y2, z2, x3, y3, z3, split) => {
    const color = "#black";

    line(x1, y1, z1, x2, y2, z2, color);
    line(x2, y2, z2, x3, y3, z3, color);
    line(x3, y3, z3, x1, y1, z1, color);
    const canSplit = Math.abs(x2 - x1) > 0.1 || Math.abs(y2 - y1) > 0.1;
    if (split && canSplit) {
      const newX = (x1 + x3) / 2;
      const newY = (y1 + y3) / 2;

      tri(x1, y1, newX, newY, x2, y2, Math.random() > Math.random());
      tri(x2, y2, newX, newY, x3, y3, Math.random() > 0.1);
    }
  };
  const cylIdxArr = new Array(...cylIdx);
  const cylPointsArr = new Array(...cylVertices);
  for (var i = 0; i < cylIdxArr.length; i += 9) {
    // const [x1, y1, z1, x2, y2, z2, x3, y3, z3] = cylIdxArr
    const xyz = cylIdxArr.slice(i, i + 3);

    points.push(
      cylPointsArr[xyz[0]],
      cylPointsArr[xyz[0] + 1],
      cylPointsArr[xyz[0] + 2],
      cylPointsArr[xyz[1]],
      cylPointsArr[xyz[1] + 1],
      cylPointsArr[xyz[1] + 2],
      cylPointsArr[xyz[2]],
      cylPointsArr[xyz[2] + 1],
      cylPointsArr[xyz[2] + 2]
    );

    // .flat();
    // console.log(vals);
    // points.push(x1, y1, z1, x2, y2, z2, x3, y3, z3);
    // tri(x1, y1, z1, x2, y2, z2, x3, y3, z3, true);
  }
  points = points.flat();
  console.log(points);
  var geometry = new THREE.BufferGeometry();
  var positions = new Float32Array(cylPointsArr);
  geometry.addAttribute("position", new THREE.BufferAttribute(positions, 3));

  var material = new THREE.MeshBasicMaterial({
    color: 0xaaaaaa,
    side: THREE.DoubleSide
  });
  // const mesh = new THREE.Line(
  //   geometry,
  //   new THREE.LineBasicMaterial({
  //     color: "white",
  //     linewidth: 2

  //     // wireframe: true
  //   })
  // );
  const mesh = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ size: 0.1 })
  );
  // mesh.rotation.x = 90;
  // const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(-1 / 2, -1 / 2, 0);
  scene.add(mesh);

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
    // And render events here
    render({ time, deltaTime }) {
      // mesh.rotation.y += 1;
      controls.update();
      renderer.render(scene, camera);
    },
    // Dispose of WebGL context (optional)
    unload() {
      renderer.dispose();
    }
  };
};

canvasSketch(sketch, settings);
