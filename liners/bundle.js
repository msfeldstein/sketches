(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const canvas = document.createElement('canvas')
canvas.width = window.innerWidth * window.devicePixelRatio
canvas.height = window.innerHeight * window.devicePixelRatio
document.body.style.margin = 0
canvas.style.width = "100%"
canvas.style.height = "100%"
document.body.appendChild(canvas)

const ctx = canvas.getContext('2d')
// ctx.translate(canvas.width / 2, 0)

let i = 0
let jitter = 100
let scale = 20
const innerRad = 200
const outerRad = 200
ctx.strokeStyle = 'rgba(0,0,0,0.1)'
ctx.lineWidth = 0.3
function rand() {
    return Math.random() * 2 - 1
}
let x1 = x2 = canvas.width / 2
// let x2 = Math.random() * canvas.width
let y = 0
function next() {
    for (var j = 0; j < 20; j++) {
        ctx.beginPath()
        ctx.moveTo(x1, y)
        ctx.lineTo(x2, y)
        ctx.stroke()
        x1 += rand() * 5
        x2 += rand() * 5
        i += 1
        y += 1
    }
    

    if (y > canvas.height) y = 0
    requestAnimationFrame(next)
}
requestAnimationFrame(next)

},{}]},{},[1]);
