const canvasSketch = require('canvas-sketch');
const createRegl = require('regl');
const hsv2rgb = require('hsv2rgb')
const mat4 = require('gl-mat4')
const glslify = require('glslify')

const settings = {
  // Make the loop animated
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: 'webgl',
  // Turn on MSAA
  attributes: { antialias: true }
};

const NUM_POINTS = 1e4
const sketch = ({ gl }) => {
  // Setup REGL with our canvas context
  const regl = createRegl({ gl });

  const POINTS_PER_SIDE = 1e3
  const top = []
  const right = []
  const bottom = []
  const left = []
  for (var i = 0; i < POINTS_PER_SIDE; i++) {
    top.push(-1 + 2 * i / POINTS_PER_SIDE, -1, 0)
    bottom.push(1 - 2 * i / POINTS_PER_SIDE, 1, 0)
    left.push(-1, 1 - 2 * i / POINTS_PER_SIDE, 0)
    right.push(1, -1 + 2 * i / POINTS_PER_SIDE, 0)
  }
  const points = [top, right, bottom, left]
  const pointBuffer = regl.buffer(points)


  const drawParticles = regl({
    vert: glslify`
    precision mediump float;
    #pragma glslify: noise = require('glsl-noise/simplex/3d')
    attribute vec3 position;
    uniform float time;
    uniform float noiseAmount;
    uniform float scale;
    uniform mat4 view, projection;
    void main() {
      gl_PointSize = 1.;
      float dx = noise(position.xyz * 100.0);
      float dy = noise(position.yzx * 100.0);
      float dz = noise(position.zxy * 100.0);
      vec3 offsetPosition = position * scale + vec3(dx, dy, dz) * noiseAmount;
      gl_Position = projection * view * vec4(offsetPosition, 1);
    }`,

    frag: `
    precision lowp float;
    varying vec3 fragColor;
    void main() {
      if (length(gl_PointCoord.xy - 0.5) > 0.5) {
        discard;
      }
      gl_FragColor = vec4(1.0);
    }`,

    attributes: {
      position: {
        buffer: pointBuffer,
      },
    },

    uniforms: {
      noiseAmount: regl.prop('noiseAmount'),
      scale: regl.prop('scale'),
      view: ({tick}) => {
        const t = Math.PI  / 2
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

    count: POINTS_PER_SIDE * 4,

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

    drawParticles({
      noiseAmount: 0,
      scale: 1
    })
    drawParticles({
      noiseAmount: .1,
      scale: 1.5
    })
    drawParticles({
      noiseAmount: .2,
      scale: 2
    })
    drawParticles({
      noiseAmount: .4,
      scale: 2.5
    })

  };
};

canvasSketch(sketch, settings);
