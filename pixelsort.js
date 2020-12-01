const canvasSketch = require('canvas-sketch');
const load = require('load-asset');
const SimplexNoise = require("simplex-noise");
const noise = new SimplexNoise(0);
const settings = {
  dimensions: [2048, 2048],
  animate: true
};

const thresh = 0
const randomness = 0.02
const channelSize = 4
const imageFile = "./frame.png"

const zeroPad = (num, places) => String(num).padStart(places, '0')

function rgbToHsl(r, g, b){
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if(max == min){
        h = s = 0; // achromatic
    }else{
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h, s, l];
}

let t = 1
const sketch = async () => {
   const image = await load(`work/output_${zeroPad(t++, 3)}.jpg`)
  return ({ context, width, height }) => {

    t+= 0.1
    const imgCanvas = document.createElement('canvas')
    imgCanvas.width = image.width
    imgCanvas.height = image.height
    const imgCtx = imgCanvas.getContext('2d')
    imgCtx.drawImage(image, 0, 0)
    const imageData = imgCtx.getImageData(0, 0, imgCanvas.width, imgCanvas.height)
    const pixels = imageData.data

    const brightness = (x, y) => {
      const [h, s, l] = rgbToHsl(...get(x, y))
      return l
    }

    const get = (x, y) => {
      const i = (y * image.width + x) * 4
      return pixels.slice(i, i + 4)
    }

    const set = (x, y, r, g, b) => {
      const i = (y * image.width + x) * 4
      pixels[i] = r
      pixels[i + 1] = g
      pixels[i + 2] = b
    }

    const sort = (x, yStart, yEnd) => {
      let arr = []
      for (var y = yStart; y < yEnd; y++) {
        arr.push(get(x, y))
      }
      arr.sort((a,b) => rgbToHsl(...b)[2] - rgbToHsl(...a)[2])

      let i = 0
      for (var y = yStart; y < yEnd; y++) {
        for (var j = 0; j < channelSize; j++) {
          set(x + j, y, ...arr[i])
        }
        i++
      }
    }


    for (var x = 0; x < image.width; x += channelSize) {
      let yStart = 0;
      let inStretch = false;
      let aboveThresh = false
      let c = [Math.random() * 255, Math.random() * 255, Math.random() * 255]
      for (var y = 0; y < image.height; y++) {
        const l = brightness(x, y)
        const nextAboveThresh = l > thresh
        const switching = (!nextAboveThresh && aboveThresh) || (nextAboveThresh && !aboveThresh)
        aboveThresh = nextAboveThresh
        const rand = noise.noise2D(0, t) * 0.5 + 0.5
        if (switching || rand > (1 - randomness) ||  y == image.height - 1) {
          inStretch = false
          sort(x, yStart, y)
          yStart = y + 1
        }
      }
    }

    context.fillStyle = 'white';
    context.fillRect(0, 0, width, height);
    context.putImageData(imageData, 0, 0)
  };
};

canvasSketch(sketch, settings);
