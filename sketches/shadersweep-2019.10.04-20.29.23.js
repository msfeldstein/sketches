const canvasSketch = require("canvas-sketch");
const createShader = require("canvas-sketch-util/shader");
const loadAsset = require("load-asset");
const glsl = require("glslify");

// Setup our sketch
const settings = {
  context: "webgl",
  animate: true
};

// Your glsl code
const frag = glsl(`
  precision highp float;

  uniform float time;
  uniform sampler2D map;
  varying vec2 vUv;

  // All components are in the range [0…1], including hue.
vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// All components are in the range [0…1], including hue.
vec3 rgb2hsv(vec3 c)
{
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

  void main () {
    vec3 color;
    float highlightHue = mod((time / 2.0), 1.0);
    vec3 highlightColor = hsv2rgb(vec3(highlightHue, 1.0, 1.0));
    if (vUv.y > 0.9) {
      color = hsv2rgb(vec3(vUv.x, 1.0, 1.0));
    } else if (vUv.y > 0.85) {
      color = highlightColor;
    } else {
      vec2 uv = vUv.xy;
      uv.y = 1.0 - uv.y;
      color = texture2D(map, uv).rgb ;
      float h = rgb2hsv(color).x;

      // color *= vec3(max(0.0, 1.0 - max(0.0, abs(highlightHue - h))));
      color = color * vec3(abs(highlightHue - h));
    }
    gl_FragColor = vec4(color, 1.0);
  }
`);

// Your sketch, which simply returns the shader
const sketch = async ({ gl }) => {
  const image = await loadAsset("sketches/assets/outdoors.jpg");
  // Create the shader and return it
  return createShader({
    // Pass along WebGL context
    gl,
    // Specify fragment and/or vertex shader strings
    frag,
    // Specify additional uniforms to pass down to the shaders
    uniforms: {
      map: image,
      // Expose props from canvas-sketch
      time: ({ time }) => time
    }
  });
};

canvasSketch(sketch, settings);
