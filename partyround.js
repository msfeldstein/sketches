const canvasSketch = require("canvas-sketch");
const createShader = require("canvas-sketch-util/shader");
const glsl = require("glslify");

// Setup our sketch
const settings = {
  context: "webgl",
  animate: true,
};

const colors = [
  "#161516",
  "#72AEDC",
  "#B4558B",
  "#BEDBD9",
  "#80574B",
  "#D08247",
  "#3A619A",
  "#BE3B45",
  "#BF6B85",
  "#CCCB5C",
  "#426B40",
  "#DA3A33",
];

// Your glsl code
const frag = glsl(`
  precision highp float;

  uniform float time;
  varying vec2 vUv;
  uniform sampler2D colors;

  void main () {
    vec3 color = 0.5 + 0.5 * cos(time + vUv.xyx + vec3(0.0, 2.0, 4.0));
    gl_FragColor = texture2D(colors, vUv);
  }
`);

// Your sketch, which simply returns the shader
const sketch = ({ gl }) => {
  const image = new Image();
  image.src = "./partyround-colors.png";
  // Create the shader and return it
  return createShader({
    // Pass along WebGL context
    gl,
    // Specify fragment and/or vertex shader strings
    frag,
    // Specify additional uniforms to pass down to the shaders
    uniforms: {
      // Expose props from canvas-sketch
      time: ({ time }) => time,
      texture: image,
    },
  });
};

canvasSketch(sketch, settings);
