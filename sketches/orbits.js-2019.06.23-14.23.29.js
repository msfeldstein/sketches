const canvasSketch = require("canvas-sketch");

const util = require("../util");
const settings = {
  dimensions: [2048, 2048],
  // animate: true
};

const W = settings.dimensions[0];
const H = settings.dimensions[1];

const ring = [];
const r = settings.dimensions[0] / 4;
const colors = ["#205374", "#27A09E", "#30CE88", "#7DE393", "#D3F5CE"];
colors.forEach((c, i) => {
  for (var theta = 0; theta < Math.PI * 12; theta += 0.001) {
    let jitterR = r + util.normalDistribution() * 120 + i * 30;
    let jitterTheta = theta + util.rand(1.1);
    ring.push({
      color: c,
      center: {
        x: util.rand(30),
        y: util.rand(30),
      },
      r: jitterR,
      startAngle: jitterTheta,
      finishAngle: jitterTheta + Math.random() * 2.2,
      speed: 0.02 + Math.random() * 0.1,
    });
  }
});

const sketch = () => {
  return ({ canvas, context, width, height }) => {
    context.fillStyle = "black";
    context.globalCompositeOperation = "screen";

    context.fillRect(0, 0, width, height);
    context.globalAlpha = 0.01;
    context.translate(canvas.width / 2, canvas.height / 2);

    ring.forEach((p) => {
      context.strokeStyle = p.color;
      context.lineWidth = 2;
      context.beginPath();
      context.arc(p.center.x, p.center.y, p.r, p.startAngle, p.finishAngle);
      context.stroke();
      p.startAngle += p.speed;
      p.finishAngle += p.speed;
    });
    // context.globalAlpha = 0.01
    // context.scale(1.3,1.3)
    // ring.forEach(p => {
    //   context.strokeStyle = p.color
    //   context.lineWidth = 2
    //   context.beginPath()
    //   context.arc(p.center.x + util.rand(220), p.center.y+ util.rand(220), p.r, p.startAngle, p.finishAngle)
    //   context.stroke()
    //   p.startAngle += p.speed
    //   p.finishAngle += p.speed
    // })
  };
};

canvasSketch(sketch, settings);
