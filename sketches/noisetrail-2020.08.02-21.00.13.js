// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require("three");

const noise = require('../perlin').noise

// Include any additional ThreeJS examples below
require("three/examples/js/controls/OrbitControls");

const canvasSketch = require("canvas-sketch");
const MAX_POINTS = 10000

var pointCount = 0

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

  // Setup a camera
  const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 100);
  camera.position.set(0, 0, -4);
  camera.lookAt(new THREE.Vector3());

  // Setup camera controller
  const controls = new THREE.OrbitControls(camera, context.canvas);

  // Setup your scene
  const scene = new THREE.Scene();
  const generatorPlaneSize = 512
  const positions = new Float32Array(2048 * 2048 * 3);
  
  var pointGeo = new THREE.BufferGeometry();
  const vertices = new THREE.BufferAttribute( positions, 3 )
  const born = new THREE.BufferAttribute(new Float32Array(positions.length / 3), 1)
  pointGeo.setAttribute( 'position', vertices  );
  pointGeo.setAttribute('born', born)
  const vertexShader = `
  attribute float size;
  attribute float born;
  varying float life;
  uniform float time;
			void main() {
        vec3 p = position;
        p.z += time;
				vec4 mvPosition = modelViewMatrix * vec4( p, 1.0 );

				gl_PointSize = 0.010 * ( 300.0 / -mvPosition.z );

				gl_Position = projectionMatrix * mvPosition;
        life = time - born;
			}
  `

  const fragmentShader = `
  varying float life;
			void main() {
				gl_FragColor = vec4(1.0 * life );
			}
  `
  var pointMat = new THREE.ShaderMaterial( {
    uniforms: {
      time: {value: 0},
      color: { value: new THREE.Color( 0xffffff ) },
    },
    vertexShader,
    fragmentShader,  

    alphaTest: 0.9

  } );
const points = new THREE.Points(pointGeo, pointMat)
points.scale.set(0.003, 0.003, 0.003)
points.position.set(-1, -1, 0)
scene.add(points)
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
      const offset = pointCount
      for (var x = 0; x < generatorPlaneSize; x+=2) {
        for (var y = 0 ; y < generatorPlaneSize; y+=2) {
          const v = noise.simplex3(x / 300 , y / 300, time * 0.1) 
          if (v > 0.5 && v < 0.6) {
            const i = (pointCount  * 3) % (positions.length)
            positions[i] = x
            positions[i + 1] = y
            positions[i + 2] = -time * 30
            born[i / 3] = time
            pointCount++
          }
        }
      }
      vertices.updateRange.offset = offset * 3
      vertices.updateRange.count = generatorPlaneSize * generatorPlaneSize / 4 * 3
      vertices.needsUpdate = true
      born.updateRange.offset = offset
      born.updateRange.count = generatorPlaneSize * generatorPlaneSize / 4
      born.needsUpdate = true
      pointMat.uniforms.time.value = time * 30
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
