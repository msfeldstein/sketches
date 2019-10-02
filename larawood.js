const canvasSketch = require("canvas-sketch");
const createShader = require("canvas-sketch-util/shader");
const load = require("load-asset");
var glsl = require("glslify");
// Setup our sketch
const settings = {
	dimensions: [512, 512],
	context: "webgl",
	animate: true
};

// Your glsl code
const frag = glsl`
  precision highp float;


  uniform float time;
  varying vec2 vUv;
  uniform sampler2D lightPalette;

  #pragma glslify: noise = require('glsl-noise/simplex/3d')
  float speed = 0.0;

  void main () {
    float anim = sin(time) * 0.5 + 0.5;
    // float v = noise(vUv.xy * vec2(0.4, 1.0), 3.8);
    float noisev = noise(vec3(vUv.xy * vec2(0.40, 1.0), time * speed + 10.0));
    float v = floor(((noisev * 0.5 + 0.5)) * 20.0) / 10.0;
    float downv = 2.0 * (1.0 - v);
    v = (1.0 - step(v, 0.5)) * v + step(downv, 0.5) * downv;
    vec4 c = texture2D(lightPalette, vec2(v + 0.5 / 10.0, 0.5));
    // vec4 c = vec4(v,v,v,1.0);
    gl_FragColor = vec4(c.rgb, 1.0);
  }
`;

// Your sketch, which simply returns the shader
const sketch = async ({ gl }) => {
	const img = await load("./LightPalette.png");

	console.log(img);
	// Create the shader and return it. It will be rendered by regl.
	return createShader({
		// Pass along WebGL context
		gl,
		// Specify fragment and/or vertex shader strings
		frag,
		// Specify additional uniforms to pass down to the shaders
		uniforms: {
			// Expose props from canvas-sketch
			time: ({ time }) => time,
			lightPalette: img
		}
	});
};

canvasSketch(sketch, settings);
