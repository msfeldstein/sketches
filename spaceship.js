const canvas = document.createElement('canvas')
canvas.width = window.innerWidth * window.devicePixelRatio
canvas.height = window.innerHeight * window.devicePixelRatio
document.body.style.margin = '0'
document.body.style.overflow = 'hidden'
document.body.style.background = '#000'
canvas.style.width = '100%'
canvas.style.height = '100%'
document.body.appendChild(canvas)

const ctx = canvas.getContext('2d')
const W = canvas.width
const H = canvas.height

const stars = []
for (let i = 0; i < 400; i++) {
  stars.push({
    x: Math.random() * W,
    y: Math.random() * H,
    size: Math.random() * 2 + 0.5,
    speed: Math.random() * 3 + 1,
    brightness: Math.random() * 0.7 + 0.3,
  })
}

const nebulaClouds = []
for (let i = 0; i < 12; i++) {
  nebulaClouds.push({
    x: Math.random() * W,
    y: Math.random() * H,
    radius: Math.random() * 200 + 80,
    hue: Math.random() * 60 + 240,
    speed: Math.random() * 0.5 + 0.2,
    alpha: Math.random() * 0.03 + 0.01,
  })
}

let shipX = W / 2
let shipY = H * 0.65
let shipAngle = 0
let targetAngle = 0
let engineFlicker = 0
let time = 0

function drawStarfield() {
  for (const star of stars) {
    star.y += star.speed * 2
    if (star.y > H) {
      star.y = 0
      star.x = Math.random() * W
    }
    const twinkle = 0.5 + 0.5 * Math.sin(time * 3 + star.x)
    ctx.fillStyle = `rgba(255,255,255,${star.brightness * twinkle})`
    ctx.beginPath()
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawNebula() {
  for (const cloud of nebulaClouds) {
    cloud.y += cloud.speed * 2
    if (cloud.y - cloud.radius > H) {
      cloud.y = -cloud.radius
      cloud.x = Math.random() * W
    }
    const grad = ctx.createRadialGradient(
      cloud.x, cloud.y, 0,
      cloud.x, cloud.y, cloud.radius
    )
    grad.addColorStop(0, `hsla(${cloud.hue}, 80%, 50%, ${cloud.alpha * 2})`)
    grad.addColorStop(0.5, `hsla(${cloud.hue + 20}, 60%, 30%, ${cloud.alpha})`)
    grad.addColorStop(1, 'transparent')
    ctx.fillStyle = grad
    ctx.fillRect(
      cloud.x - cloud.radius,
      cloud.y - cloud.radius,
      cloud.radius * 2,
      cloud.radius * 2
    )
  }
}

function drawShip(x, y, angle) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)

  const s = Math.min(W, H) * 0.04

  ctx.shadowColor = '#0af'
  ctx.shadowBlur = 20

  ctx.fillStyle = '#334'
  ctx.beginPath()
  ctx.moveTo(0, -s * 2.2)
  ctx.lineTo(-s * 0.7, -s * 0.3)
  ctx.lineTo(-s * 1.5, s * 1.2)
  ctx.lineTo(-s * 0.5, s * 0.8)
  ctx.lineTo(0, s * 1.0)
  ctx.lineTo(s * 0.5, s * 0.8)
  ctx.lineTo(s * 1.5, s * 1.2)
  ctx.lineTo(s * 0.7, -s * 0.3)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = '#556'
  ctx.beginPath()
  ctx.moveTo(0, -s * 2.2)
  ctx.lineTo(-s * 0.4, -s * 0.3)
  ctx.lineTo(0, s * 1.0)
  ctx.lineTo(s * 0.4, -s * 0.3)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = '#0cf'
  ctx.shadowColor = '#0cf'
  ctx.shadowBlur = 8
  ctx.beginPath()
  ctx.ellipse(0, -s * 1.0, s * 0.25, s * 0.4, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.shadowBlur = 0
  ctx.shadowColor = 'transparent'

  drawEngine(0, s * 1.0, s, 1.0)
  drawEngine(-s * 0.9, s * 1.1, s * 0.6, 0.7)
  drawEngine(s * 0.9, s * 1.1, s * 0.6, 0.7)

  ctx.restore()
}

function drawEngine(ox, oy, size, intensity) {
  engineFlicker = Math.sin(time * 30) * 0.3 + Math.sin(time * 47) * 0.2
  const flameLen = size * (1.8 + engineFlicker * 0.5) * intensity

  const grad = ctx.createLinearGradient(ox, oy, ox, oy + flameLen)
  grad.addColorStop(0, `rgba(150, 220, 255, ${0.9 * intensity})`)
  grad.addColorStop(0.2, `rgba(80, 160, 255, ${0.7 * intensity})`)
  grad.addColorStop(0.5, `rgba(40, 80, 200, ${0.4 * intensity})`)
  grad.addColorStop(1, 'transparent')

  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.moveTo(ox - size * 0.3, oy)
  ctx.quadraticCurveTo(ox - size * 0.1, oy + flameLen * 0.6, ox, oy + flameLen)
  ctx.quadraticCurveTo(ox + size * 0.1, oy + flameLen * 0.6, ox + size * 0.3, oy)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = `rgba(200, 240, 255, ${0.5 * intensity})`
  ctx.beginPath()
  ctx.arc(ox, oy, size * 0.15, 0, Math.PI * 2)
  ctx.fill()
}

const particles = []

function spawnParticles(x, y) {
  for (let i = 0; i < 2; i++) {
    particles.push({
      x: x + (Math.random() - 0.5) * 10,
      y: y,
      vx: (Math.random() - 0.5) * 2,
      vy: Math.random() * 4 + 2,
      life: 1,
      size: Math.random() * 3 + 1,
      hue: 200 + Math.random() * 40,
    })
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.x += p.vx
    p.y += p.vy
    p.life -= 0.02
    if (p.life <= 0) {
      particles.splice(i, 1)
      continue
    }
    ctx.fillStyle = `hsla(${p.hue}, 80%, 60%, ${p.life * 0.5})`
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
    ctx.fill()
  }
}

let mouseX = W / 2
let mouseY = H / 2

window.addEventListener('mousemove', (e) => {
  mouseX = e.clientX * window.devicePixelRatio
  mouseY = e.clientY * window.devicePixelRatio
})

window.addEventListener('touchmove', (e) => {
  mouseX = e.touches[0].clientX * window.devicePixelRatio
  mouseY = e.touches[0].clientY * window.devicePixelRatio
})

function animate() {
  time += 0.016

  ctx.fillStyle = 'rgba(0, 0, 8, 0.3)'
  ctx.fillRect(0, 0, W, H)

  drawNebula()
  drawStarfield()

  const dx = mouseX - shipX
  const dy = mouseY - shipY
  shipX += dx * 0.04
  shipY += dy * 0.04
  targetAngle = -dx * 0.0004
  shipAngle += (targetAngle - shipAngle) * 0.08

  const bobX = Math.sin(time * 1.5) * 8
  const bobY = Math.cos(time * 2.0) * 5

  spawnParticles(
    shipX + bobX + Math.sin(shipAngle) * 10,
    shipY + bobY + Math.min(W, H) * 0.04 * 1.0
  )
  updateParticles()
  drawShip(shipX + bobX, shipY + bobY, shipAngle)

  requestAnimationFrame(animate)
}

ctx.fillStyle = '#000008'
ctx.fillRect(0, 0, W, H)
animate()
