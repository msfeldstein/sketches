const canvasSketch = require("canvas-sketch");
const noise = require("../perlin").noise;
const load = require("load-asset");

const settings = {
	dimensions: [2048, 2048],
	animate: true
};

const sketch = async ({ context, width, height }) => {
	const grd = context.createLinearGradient(0, 0, width, height);
	grd.addColorStop(0, "#032E3E");
	grd.addColorStop(1, "#19646A");
	context.fillStyle = grd;
	context.fillRect(0, 0, width, height);

	// stars
	context.fillStyle = "white";
	for (var i = 0; i < 10000; i++) {
		context.globalAlpha = Math.random();
		context.fillRect(
			Math.random() * width,
			Math.random() * height,
			Math.random() * 3,
			Math.random() * 3
		);
	}

	const sprite = await load("assets/line.png");

	function light(color) {
		const p1 = {
			x: Math.random() * 300 + width / 2,
			y: Math.random() * 300 + height / 2
		};
		const p2 = {
			x: 1000,
			y: 1200
		};
		const c1 = {
			x: 200,
			y: 1000
		};
		const c2 = {
			x: 900,
			y: 1200
		};

		return {
			point: function() {
				const x =
					(noise.simplex2(p1.x, this.t) + this.t / 10) * 1000 + width / 2;
				const y = noise.simplex2(p1.y, this.t) * 300 + height / 2;
				return { x, y };
			},
			draw: function(context) {
				const point = this.point();
				context.strokeStyle = this.color;
				context.lineWidth = 1 / 2;
				context.beginPath();
				// context.moveTo(point.x, point.y);
				// context.lineTo(point.x, point.y - Math.pow(Math.random(), 2) * 800);
				context.drawImage(sprite, point.x, point.y);
				context.stroke();
			},
			t: 0,
			color
		};
	}
	const lights = [
		light("#00CF52"),
		light("#00CF52"),
		light("#00CF52"),
		light("#00C690"),
		light("#00DF96")
	];
	context.translate(0, height / 2);
	noise.seed(Math.random());
	return ({}) => {
		context.globalAlpha = 0.05;
		for (var i = 0; i < 100; i++) {
			lights.forEach(l => {
				l.t += 0.00001;
				for (var j = 0; j < 1; j++) {
					l.draw(context);
				}
			});
		}
		// context.fillStyle = "rgba(0,0,0,0.03)";
		// context.fillRect(0, 0, width, height);
	};
};

canvasSketch(sketch, settings);
