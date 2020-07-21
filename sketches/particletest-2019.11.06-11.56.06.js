const canvasSketch = require("canvas-sketch");
const SimplexNoise = require("simplex-noise");
const glslify = require("glslify");
const noise = new SimplexNoise();

// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require("three");

// Include any additional ThreeJS examples below
require("three/examples/js/controls/OrbitControls");

const loadImage = src => {
  return new Promise(resolve => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      resolve(img);
    };
  });
};
const settings = {
  // Make the loop animated
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: "webgl",
  // Turn on MSAA
  attributes: { antialias: true }
};

const sketch = async ({ context }) => {
  // Create a renderer
  const renderer = new THREE.WebGLRenderer({
    context
  });

  // WebGL background color
  renderer.setClearColor("#000", 1);

  // Setup your scene
  const scene = new THREE.Scene();

  const fragmentShader = glslify`
      varying float opacity;
      void main() {
        gl_FragColor = vec4(1.0, 1.0, 1.0, opacity);
      }
       
      `;
  const vertexShader = glslify`
  attribute float value;
  uniform float numLines;
  uniform float time;
  varying float opacity;
  #pragma glslify: snoise3 = require(glsl-noise/simplex/3d)
  void main() 
  {
    vec3 offsetPos = position.xyz + snoise3(vec3(position.xy * 10.0, time * 0.1)) * 1.0;
    vec4 modelViewPosition = modelViewMatrix * vec4(offsetPos, 1.0);
    vec4 pos = projectionMatrix * modelViewPosition;
    gl_Position = pos;
    gl_PointSize =2.0;
    opacity  = value;
  }

      `;
  const img = await loadImage("inknoise.jpg");
  const vertices = [];
  const values = [];
  const imgCanvas = document.createElement("canvas");
  imgCanvas.width = img.width;
  imgCanvas.height = img.height;
  const imgCtx = imgCanvas.getContext("2d");
  imgCtx.drawImage(img, 0, 0);
  const pixels = imgCtx.getImageData(0, 0, img.width, img.height).data;
  for (var i = 0; i < pixels.length; i += 4) {
    if (pixels[i] > 10) {
      const x = i % (img.width * 4);
      const y = Math.floor(i / (img.width * 4));
      vertices.push(x / img.width, y / img.width, 0);
      values.push(pixels[i] / 255);
    }
  }
  console.log(vertices);

  // Setup a camera
  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
  camera.position.set(0, 0, -1);
  camera.lookAt(new THREE.Vector3());
  camera.far = 10000;
  // Setup camera controller
  const controls = new THREE.OrbitControls(camera, context.canvas);

  const geometry = new THREE.BufferGeometry();
  geometry.addAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );
  geometry.addAttribute("value", new THREE.Float32BufferAttribute(values, 1));

  const material = new THREE.ShaderMaterial({
    fragmentShader,
    vertexShader,
    transparent: true,
    depthTest: false,
    uniforms: {
      time: { value: 0 }
    }
  });
  console.log(vertices);

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);
  particles.position.x = -1 / 2;
  particles.position.y = -1 / 4;
  console.log(particles.position);
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
      scene.children.forEach(child => {
        if (
          child.material &&
          child.material.uniforms &&
          child.material.uniforms.time
        ) {
          child.material.uniforms.time.value = time;
        }
      });
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
