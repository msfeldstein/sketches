const {rand, lerp, dist} = require('./util')
const noise = require('./perlin').noise
noise.seed(Math.random())
const colormap = require('colormap')
const canvas = document.createElement('canvas')
canvas.width = window.innerWidth * window.devicePixelRatio
canvas.height = window.innerHeight * window.devicePixelRatio
document.body.style.margin = 0
canvas.style.width = "100%"
canvas.style.height = "100%"
document.body.appendChild(canvas)

const ctx = canvas.getContext('2d')
ctx.fillRect(0,0,canvas.width, canvas.height)

let colors = colormap({
    colormap: 'jet',
    nshades: 32000,
    format: 'hex',
    alpha: 1
})

const cx = canvas.width / 2
const cy = canvas.height / 2

let particles = []
for (var i = 0; i < colors.length; i++) {
    particles.push({
        x: cx + rand(10),
        y: cy + rand(10),
        color: colors[i],
        i: i,
        lastTheta: null
    })
}

let t = 0
ctx.lineWidth = .1
ctx.globalAlpha = .1
function step() {
    ctx.beginPath()
    let lastX = 0
    let lastY = 0
    particles.forEach(p => {
        if (lastX != 0) {
            ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        ctx.strokeStyle = p.color
        ctx.fillStyle = p.color
        let theta = noise.simplex3(p.x / 200, p.y / 200, p.i / particles.length * 100) * 2 * Math.PI

        p.x += Math.cos(theta)
        p.y += Math.sin(theta)

        ctx.lineTo(p.x, p.y)
        }
        
        lastX = p.x
        lastY = p.y
        ctx.stroke()
        ctx.fill()
    })
    t ++ 
    requestAnimationFrame(step)
}
step()

const recordedChunks = []
const options = { mimeType: 'video/webm; codecs=vp9'}
const stream = canvas.captureStream(25)
console.log(stream)
const mediaRecorder = new MediaRecorder(stream)
const ondata = function(event) {
    console.log(event.data)
    if (event.data.size > 0) {
        recordedChunks.push(event.data)
    }
}
mediaRecorder.addEventListener('dataavailable', ondata)
mediaRecorder.ondataavailable = ondata
mediaRecorder.start()

mediaRecorder.addEventListener('stop', function() {
    const blob = new Blob(recordedChunks, {
        type: 'video/mp4'
    })
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a');
    document.body.appendChild(a);
    a.style = 'display: none';
    a.href = url;
    a.download = 'test.mp4';
    a.click();
    window.URL.revokeObjectURL(url);
})

canvas.addEventListener('click', function() {
    mediaRecorder.stop()
    console.log("Save")
    
})