const canvasSketch = require('canvas-sketch');

const settings = {
  dimensions: [2048, 2048],
  animate: true
};

const sketch = () => {
  return ({ context, width, height, time }) => {
    context.fillStyle = 'black';
    context.fillRect(0, 0, width, height);
        context.shadowColor = 'red'
    context.shadowBlur = 20
    context.strokeStyle = "red"
    context.lineWidth = 4
    let y = 0
    let step = 5
    while (y < height) {
      context.beginPath()
      context.moveTo(0, y)
      context.lineTo(width, y)
      context.stroke()
      y += step;
      step += 5
    }

    let circle = (x, y, r) => {
      context.beginPath()

      context.arc(x, y, r, 0, Math.PI * 2)
      context.stroke()
      context.fill()
    }


    context.lineWidth = 10
    circle(width / 2, height / 2, 600)
    context.lineWidth = 8
    for (var x = 0; x < width; x += 100) {
      const r = 600 - x + time * 30
      if (r > 0 && r < 601)
        circle( width / 2,height / 2 + 600 - r, r)
    }
  };
};

canvasSketch(sketch, settings);
