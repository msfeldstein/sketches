const {rand, lerp} = require('./util')
const noise = require('./perlin').noise
const canvas = document.createElement('canvas')
canvas.width = window.innerWidth * window.devicePixelRatio
canvas.height = window.innerHeight * window.devicePixelRatio
document.body.style.margin = 0
canvas.style.width = "100%"
canvas.style.height = "100%"
document.body.appendChild(canvas)

const ctx = canvas.getContext('2d')
ctx.fillRect(0,0,canvas.width, canvas.height)
window.noise = noise
console.log(noise.simplex2(0,0))
const width = 400
ctx.lineWidth = 0.1
ctx.strokeStyle = 'rgba(255,255,255,0.1)'
for (var y = canvas.height - 200; y > 200 ; y -= .03) {
    ctx.beginPath()
    let left = canvas.width / 2 - width;
    let right = canvas.width / 2 + width
    let first = true
    let modifiedY = y
    let jitterX = rand(.2)
    let delta = 0
    let firstY = 0
    for (var x = -1; x <= 1; x += .05) {
        let modifiedX = lerp(x, canvas.width / 2, right)
        delta = noise.simplex2(x, y) * 20
        let modifiedY = y +Math.sin(Math.abs((x + jitterX) * Math.PI / 2)) * 130 + delta
        if (first) {
            firstY = modifiedY
            ctx.moveTo(modifiedX, modifiedY)
        } else {
            ctx.lineTo(modifiedX, modifiedY)
        }
        first = false
        
    }

    ctx.stroke()
    // ctx.lineTo(right, 0)
    // ctx.lineTo(left, 0)
    // ctx.lineTo(left, firstY)
    // ctx.fill()
}
