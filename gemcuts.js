const dat = require("dat.gui");
// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require("three");
// Include any additional ThreeJS examples below
require("three/examples/js/controls/OrbitControls");
require('three/examples/js/loaders/RGBELoader.js')
const HDRCubeTextureLoader = require('three/examples/js/loaders/HDRCubeTextureLoader.js')
const canvasSketch = require("canvas-sketch");
const { Side } = require("three");
const hdrImage = "./kloppenheim_02_4k.hdr"

const settings = {
  // Make the loop animated
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: "webgl"
};



const sketch = ({ context }) => {
  // Create a renderer
  const renderer = new THREE.WebGLRenderer({
    canvas: context.canvas
  });


  // WebGL background color
  renderer.setClearColor("#000", 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.outputEncoding = THREE.sRGBEncoding;

  // Setup a camera
  const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 100);
  camera.position.set(8, 0, 1);
  camera.lookAt(new THREE.Vector3());

  // Setup camera controller
  const controls = new THREE.OrbitControls(camera, context.canvas);

  // Setup your scene
  const scene = new THREE.Scene();

  const pmremGenerator = new THREE.PMREMGenerator( renderer );
	pmremGenerator.compileEquirectangularShader();

  let envMap = null
  const loader = new THREE.RGBELoader();
  loader.load(hdrImage, function (texture) {
    envMap = pmremGenerator.fromEquirectangular(texture)
    scene.background = envMap.texture
    console.log(envMap.texture)
  })

  const opts = {
    numSides: 8,
    sideEdgeHeight: 0.1
  }
  const gui = new dat.GUI();
  gui.add(opts, 'numSides', 4, 32, 1).onChange(regenerate)
  gui.add(opts, 'sideEdgeHeight', 0, 1).onChange(regenerate)

  let mesh;
  function regenerate() {
    if (mesh) {
      scene.remove(mesh)
    }
    const vertices = []
    for (var i = 0; i < opts.numSides; i++) {
      const thetaStart = Math.PI * 2 / opts.numSides * i
      const thetaStop = Math.PI * 2 / opts.numSides * (i + 1)
      const r = 1
      const x = r * Math.cos(thetaStart)
      const y = r * Math.sin(thetaStart)
      const x2 = r * Math.cos(thetaStop)
      const y2 = r * Math.sin(thetaStop)

      const bottomPoint = [0, -1, 0]
      const lowerEdgeP1 = [x, 0, y]
      const lowerEdgeP2 = [x2, 0, y2]
      const upperEdgeP1 = [x, opts.sideEdgeHeight, y]
      const upperEdgeP2 = [x2, opts.sideEdgeHeight, y2]
      // To Bottom Point
      vertices.push(
        lowerEdgeP1,
        lowerEdgeP2,
        bottomPoint
      )

      // Side Edges
      vertices.push(
        lowerEdgeP2,
        lowerEdgeP1,
        upperEdgeP1,

        lowerEdgeP2,
        upperEdgeP1,
        upperEdgeP2

      )
    }
    const verticesFloatArray = new Float32Array(vertices.flat())
    // Setup a geometry
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(verticesFloatArray, 3))
    geometry.computeVertexNormals()
    mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.01,
      envMapIntensity: 1
    }))
    scene.add(mesh)
  }
  regenerate()


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
      if (mesh && envMap && mesh.material.envMap != envMap.texture) {
        mesh.material.envMap = envMap.texture
        mesh.material.needsUpdate = true
      }
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
