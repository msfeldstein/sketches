const SVGPathInterpolator = require('svg-path-interpolator')

const config = {
    joinPathData: true,
    minDistance: 0.05,
    roundToNearest: 0.025,
    sampleFrequency: 0.000001
};


const canvas = document.createElement('canvas')
canvas.width = window.innerWidth * window.devicePixelRatio
canvas.height = window.innerHeight * window.devicePixelRatio
document.body.style.margin = 0
canvas.style.width = "100%"
canvas.style.height = "100%"
document.body.appendChild(canvas)

const ctx = canvas.getContext('2d')
ctx.translate(canvas.width / 2, canvas.height / 2)

const svgString = `
<svg width="30" height="36" viewBox="0 0 30 36" fill="none" xmlns="http://www.w3.org/2000/svg">
<path id="c" d="M16 12.0001C31.5 -8.99992 9.99996 5.50008 3.49996 20.5001C-3.00004 35.5001 5.99996 40 29.5 29.5" stroke="black"/>
</svg>
`;

const fullnameSvgString = `
<svg width="103" height="36" viewBox="0 0 103 36" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M78 14.9999C80.75 14.0241 83.2481 13.0798 85.5 12.2144M92.5 28.5C94.3333 29.5 97.5 28.5 101.5 25.5C105.946 22.1658 92 20.8333 85.5 21.5C91 19.3333 101.9 13.9999 101.5 9.99992C101.089 5.887 95.9409 8.2022 85.5 12.2144M85.5 12.2144C85.1667 17.3096 85.1 28 87.5 30" stroke="black"/>
<path d="M66 21C67.2 20.6 74.1667 19.8333 77.5 19.5" stroke="black"/>
<path d="M78.5 12.5C72.9 11.3 67.8333 14 66 15.5V30.5C67.5 31.6667 71.8 32.3 77 25.5" stroke="black"/>
<path d="M50 10C52 13.6 51.8333 23.8333 51.5 28.5C54.1667 28.3333 60.3 27.1 63.5 23.5" stroke="black"/>
<path d="M30 26.5C33.1667 26.6667 40.4 26.6 44 25" stroke="black"/>
<path d="M26.5 30C34.5 21.6 37.1667 12.8333 37.5 9.5C38.6667 16.8333 42.2 31.2 47 30" stroke="black"/>
<path d="M16 12.0001C31.5 -8.99992 9.99996 5.50008 3.49996 20.5001C-3.00004 35.5001 5.99996 40 29.5 29.5" stroke="black"/>
</svg>

`
const interpolator = new SVGPathInterpolator(config);
const pathData = interpolator.processSvg(fullnameSvgString);
console.log(pathData)
let i = 0
let jitter = 3
let scale = 20
function next() {
    for (var j = 0; j < 8; j++) {
        ctx.beginPath()
        ctx.arc(
            i / 3 * Math.cos(i / 160 + j * Math.PI / 4) + Math.random() * jitter * Math.floor(1, i / 1000),
            i / 3 * Math.sin(i / 160 + j * Math.PI / 4) + Math.random() * jitter * Math.floor(1, i / 1000),
            i / 10,
            0, 2 * Math.PI)
        // ctx.strokeStyle = 'black'
        ctx.strokeStyle = 'rgba(0,0,0,0.3)'
        ctx.lineWidth = 0.1
        ctx.stroke()
    }

    i += 1
    requestAnimationFrame(next)
}
requestAnimationFrame(next)
// const path = pathData
// function next() {
//     while (i * 2 < path.length) {
//         ctx.beginPath()
//         const x = path[i * 2]
//         const y = path[i * 2 + 1]
//         ctx.arc(
//             x * scale + Math.random() * jitter,
//             y * scale + Math.random() * jitter,
//             Math.pow(Math.random(), 5) * 40,
//             0, 2 * Math.PI)
//         // ctx.strokeStyle = 'black'
//         ctx.strokeStyle = 'rgba(0,0,0,1)'
//         ctx.lineWidth = 0.1
//         ctx.stroke()
//         ctx.beginPath()
//         ctx.arc(
//             x * scale + Math.random() * jitter,
//             y * scale + Math.random() * jitter,
//             Math.pow(Math.random(), 5) * 40 * 20,
//             0, 2 * Math.PI)
//         // ctx.strokeStyle = 'black'
//         ctx.strokeStyle = 'rgba(0,0,0,0.03)'
//         ctx.lineWidth = 1
//         ctx.stroke()
//         i += 1
//     }
    
//     // requestAnimationFrame(next)
// }
requestAnimationFrame(next)