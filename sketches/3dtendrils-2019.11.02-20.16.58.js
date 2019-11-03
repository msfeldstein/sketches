const canvasSketch = require("canvas-sketch");
const SimplexNoise = require("simplex-noise");
const noise = new SimplexNoise();

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
  attributes: { antialias: true }
};

const sketch = ({ context }) => {
  // Create a renderer
  const renderer = new THREE.WebGLRenderer({
    context
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

  // Specify an ambient/unlit colour
  scene.add(new THREE.AmbientLight("#59314f"));

  // Add some light
  const light = new THREE.PointLight("#45caf7", 1, 15.5);
  light.position.set(2, 2, -4).multiplyScalar(1.5);
  scene.add(light);
  const numOffsets = 250;
  const offsetAmt = 1;
  for (var line = 0; line < 5; line++) {
    for (var i = 0; i < numOffsets; i++) {
      const vertices = [];
      for (var theta = 0; theta < (Math.PI / 2) * 3; theta += 0.01) {
        var x = Math.cos(theta) * (1 + line * 0.3);
        var y = Math.sin(theta) * (1 + line * 0.3);
        var z = 0;
        const thetaAmt = Math.max(0, theta - 1) / ((3 * Math.PI) / 2 - 1);
        var offX =
          ((noise.noise3D(x, y, z) * i) / numOffsets) * offsetAmt * thetaAmt;
        var offY =
          ((noise.noise3D(y, z, x) * i) / numOffsets) * offsetAmt * thetaAmt;
        var offZ =
          ((noise.noise3D(z, x, y) * i) / numOffsets) * offsetAmt * thetaAmt;
        vertices.push(x + offX, y + offY, z + offZ);
      }
      const geometry = new THREE.BufferGeometry();
      geometry.addAttribute(
        "position",
        new THREE.Float32BufferAttribute(vertices, 3)
      );

      // const material = new THREE.LineBasicMaterial({
      //   opacity: 0.023,
      //   color: 0xff00ff,
      //   transparent: true,
      //   alphaTest: false,
      //   depthTest: false
      // });
      const fragmentShader = `
      void main() {
        gl_FragColor = vec4(1.0, 0.0, 1.0, 0.1);
      }
       
      `;
      const vertexShader = `
      void main() 
{
	vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
	gl_Position = projectionMatrix * modelViewPosition;
}

      `;
      const material = new THREE.ShaderMaterial({
        fragmentShader,
        vertexShader,
        transparent: true,
        depthTest: false
      });

      const particles = new THREE.Line(geometry, material);
      scene.add(particles);
    }
  }
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
    }
  };
};

canvasSketch(sketch, settings);
