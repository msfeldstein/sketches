const canvasSketch = require('canvas-sketch');
const createShader = require('canvas-sketch-util/shader');
const glsl = require('glslify');

// Setup our sketch
const settings = {
  context: 'webgl',
  animate: true,
  dimensions: [2048, 2048],
};

// Your glsl code
const frag = glsl(`
  precision highp float;
  #pragma glslify: noise = require('glsl-noise/simplex/3d')
  #pragma glslify: noise2 = require('glsl-noise/simplex/2d')

vec3 blendAdd(vec3 base, vec3 blend) {
	return min(base+blend,vec3(1.0));
}

  uniform float time;
  varying vec2 vUv;
  float PI = 3.14159;
  float TWO_PI = 2.0 * PI;
  vec3 c1 = vec3(124.0, 245.0, 190.0) / vec3(255.0);
  vec3 c2 = vec3(40., 151., 155.) / vec3(255.0);
  vec3 c3 = vec3(250., 184., 104.) / vec3(255.0);

  void main () {
    float d = distance(vUv.xy, vec2(0.5));
    float ring = floor((d + time / 16.0) * 10.0) / 10.0;
    // vec3 c = vec3(0.0);
    float theta = (atan(abs(vUv.x - 0.5), vUv.y - 0.5) + 3.14159) / TWO_PI;
    ring += 1.0 / 10.0 * noise2(vec2(theta));
    vec3 bg = c1 * (0.5 + 0.5 * noise(vec3(theta * 10.1, ring, time + ring / .10)));
    vec3 fg = c2 * noise(vec3(theta * 5.1 + 6.0, ring, time + ring / .10));

    bg = blendAdd(fg, bg);
    bg = blendAdd(bg, c3 * noise(vec3(theta * 5.1 + 12.0, ring, time)));
    gl_FragColor = vec4(bg, 1.0);
  }
`);

// Your sketch, which simply returns the shader
const sketch = ({ gl }) => {
  // Create the shader and return it
  return createShader({
    // Pass along WebGL context
    gl,
    // Specify fragment and/or vertex shader strings
    frag,
    // Specify additional uniforms to pass down to the shaders
    uniforms: {
      // Expose props from canvas-sketch
      time: ({ time }) => time / 4
    }
  });
};

canvasSketch(sketch, settings);
