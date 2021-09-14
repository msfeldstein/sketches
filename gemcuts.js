const dat = require("dat.gui");
// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require("three");
// Include any additional ThreeJS examples below
require("three/examples/js/controls/OrbitControls");
require('three/examples/js/loaders/RGBELoader.js')
require('three/examples/js/exporters/GLTFExporter.js')
const HDRCubeTextureLoader = require('three/examples/js/loaders/HDRCubeTextureLoader.js')
const canvasSketch = require("canvas-sketch");

const Cuts = {
  Swiss: require("./gems/swiss"),
  Single: require('./gems/singlecut')
}

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
  camera.position.set(4, 0, 1);
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
  })

  let mesh;

  const opts = {
    type: "Swiss",
    numSides: 8,
    sideEdgeHeight: 0.1,
    topRadius: 0.6,
    capHeight: 0.35,
    download: function () {
      let exporter = new THREE.GLTFExporter()
      exporter.parse(mesh, function (gltf) {
        console.log(gltf)
        const link = document.createElement('a')
        link.href = URL.createObjectURL(new Blob([gltf], {type: 'application/octet-stream'}))
        link.download = "Gem.glb"
        link.click()
      }, { binary:true })
    }
  }
  const gui = new dat.GUI();
  gui.add(opts, "type").options(Object.keys(Cuts)).onChange(regenerate)
  gui.add(opts, 'numSides', 4, 32, 1).onChange(regenerate)
  gui.add(opts, 'sideEdgeHeight', 0, 1).onChange(regenerate)
  gui.add(opts, 'topRadius', 0, 1).onChange(regenerate)
  gui.add(opts, 'capHeight', 0, 1).onChange(regenerate)
  gui.add(opts, 'download')


  function regenerate() {
    if (mesh) {
      scene.remove(mesh)
    }
    const vertices = Cuts[opts.type](opts)
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
