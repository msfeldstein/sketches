const canvasSketch = require('canvas-sketch');
const createRegl = require('regl');
const hsv2rgb = require('hsv2rgb')
const mat4 = require('gl-mat4')

const settings = {
  // Make the loop animated
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: 'webgl',
  // Turn on MSAA
  attributes: { antialias: true }
};

const NUM_POINTS = 1e4
const VERT_SIZE = 4 * (4)

const sketch = ({ gl }) => {
  // Setup REGL with our canvas context
  const regl = createRegl({ gl });

const pointBuffer = regl.buffer(Array(NUM_POINTS).fill().map(function (i) {
  return [
    i, 0, 0, 0
  ]
}))

const drawParticles = regl({
  vert: `
  precision mediump float;
  attribute vec4 freq, phase;
  attribute vec3 color;
  uniform float time;
  uniform mat4 view, projection;
  varying vec3 fragColor;
  void main() {
    vec3 position = 8.0 * cos(freq.xyz * time + phase.xyz);
    gl_PointSize = 5.0 * (1.0 + cos(freq.w * time + phase.w));
    gl_Position = projection * view * vec4(position, 1);
    fragColor = color;
  }`,

  frag: `
  precision lowp float;
  varying vec3 fragColor;
  void main() {
    if (length(gl_PointCoord.xy - 0.5) > 0.5) {
      discard;
    }
    gl_FragColor = vec4(fragColor, 1);
  }`,

  attributes: {
    freq: {
      buffer: pointBuffer,
      stride: VERT_SIZE
      offset: 0
    },
    phase: {
      buffer: pointBuffer,
      stride: VERT_SIZE,
      offset: 16
    },
    color: {
      buffer: pointBuffer,
      stride: VERT_SIZE,
      offset: 32
    }
  },

  uniforms: {
    view: ({tick}) => {
      const t = 0.01 * tick
      return mat4.lookAt([],
        [30 * Math.cos(t), 2.5, 30 * Math.sin(t)],
        [0, 0, 0],
        [0, 1, 0])
    },
    projection: ({viewportWidth, viewportHeight}) =>
      mat4.perspective([],
        Math.PI / 4,
        viewportWidth / viewportHeight,
        0.01,
        1000),
    time: ({tick}) => tick * 0.001
  },

  count: NUM_POINTS,

  primitive: 'points'
})

  // Regl GL draw commands
  // ...

  // Return the renderer function
  return ({ time }) => {
    // Update regl sizes
    regl.poll();

    // Clear back buffer
    regl.clear({
      color: [ 0, 0, 0, 1 ]
    });

  regl.clear({
    depth: 1,
    color: [0, 0, 0, 1]
  })

  drawParticles()

  };
};

canvasSketch(sketch, settings);
