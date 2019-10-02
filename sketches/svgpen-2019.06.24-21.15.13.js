const canvasSketch = require('canvas-sketch');
import SvgParser from 'svg-path-interpolator'
import util from '../util'

const settings = {
  dimensions: [ 2048, 2048 ]
};

const svg = `<svg width="1844" height="1235" viewBox="0 0 1844 1235" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M1 196.396C612.98 -33.8137 982.592 -130.744 982.592 305.443C982.592 741.629 703.868 1710.93 1843 953.665" stroke="black"/>
</svg>
`

const segmentLength = 190
const repeatCount = 10
const sketch = () => {
  return ({ context, width, height }) => {
    
    context.fillStyle = 'black';
    context.fillRect(0, 0, width, height);
    context.globalAlpha = 0.03
    const config = {
      joinPathData: true,
      minDistance: 0.1,
      roundToNearest: 0.01,
      sampleFrequency: 0.001
    }
    const interpolator = new SvgParser(config)
    const points = interpolator.processSvg(svg)

    context.fillStyle = 'white'
    context.strokeStyle = 'white'
    for (var i = 0; i < points.length; i += 2) {
      for (var times = 0; times < repeatCount; times++) {
        context.save()
        const ro = 0
        const cx = (points[i + ro] + points[i + segmentLength * 2 + ro]) / 2
        const cy = (points[i + 1 + ro] + points[i + segmentLength * 2 + 1 + ro]) / 2
        context.translate(cx, cy)
        context.rotate(util.rand(0.4))
        // context.scale(util.rand(2), util.rand(2))
        context.translate(-cx, -cy)
        context.translate(util.rand(30), util.rand(30))
        context.beginPath()
        
        for (var j = ro; j < ro + segmentLength * 2; j += 2) {
          if (i + j > points.length - 4) break
          const x = points[i + j]
          const y = points[i + j + 1]
          context.lineTo(x, y)
        }
        context.stroke()
        context.restore()
      }
      
    }
    
  };
};

canvasSketch(sketch, settings);
