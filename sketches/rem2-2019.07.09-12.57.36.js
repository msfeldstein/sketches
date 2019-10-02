const canvasSketch = require("canvas-sketch");
const { rand } = require("../util");
const settings = {
	dimensions: [2048, 2048],
	animate: true
};

const NEURON_SIZE = 5;
const GRID_X = 30;
const GRID_Y = 30;
const NEURON_JITTER = 2110;
const ALIGN_SPEED = 0.03;
const map = new Array(GRID_Y).fill(0).map(() => new Array(GRID_Y));
class Neuron {
	constructor(x, y, xi, yi) {
		this.naturalX = x;
		this.naturalY = y;
		this.x = x + rand(NEURON_JITTER);
		this.y = y + rand(NEURON_JITTER);
		this.xi = xi;
		this.yi = yi;
		this.energy = 0;
		this.pulsing = false;
	}

	child() {
		if (this.yi >= GRID_Y - 1) return null;
		return map[this.yi + 1][this.xi];
	}

	right() {
		if (this.xi >= GRID_X - 1) return null;
		return map[this.yi][this.xi + 1];
	}

	left() {
		if (this.xi > 0) {
			return;
		}
	}

	pulse() {
		this.energy = 1;
	}

	offset() {
		const dx = this.x - this.naturalX;
		const dy = this.y - this.naturalY;
		return Math.sqrt(dx * dx + dy * dy);
	}

	update() {
		if (this.yi == 0) {
			const dx = this.naturalX - this.x;
			this.x = this.x + dx * ALIGN_SPEED;
		}

		if (this.xi == 0) {
			const dy = this.naturalY - this.y;
			this.y = this.y + dy * ALIGN_SPEED;
		}
		const c = this.child();
		if (c) {
			const dx = this.x - c.x;
			c.x = c.x + dx * ALIGN_SPEED;
		}

		const right = this.right();
		if (right) {
			const dy = this.y - right.y;
			right.y = right.y + dy * ALIGN_SPEED;
		}
	}

	draw(ctx) {
		ctx.fillStyle = `rgba(255,255,255,${this.energy * 0.5 +
			0.5 +
			Neuron.extraEnergy})`;
		ctx.strokeStyle = `rgba(255,255,255,${this.energy * 0.5 + 0.5})`;
		ctx.beginPath();
		ctx.lineWidth = 2;
		ctx.arc(this.x, this.y, NEURON_SIZE + 5 * this.energy, 0, Math.PI * 2);
		ctx.fill();
		const c = this.child();
		if (this.energy > 0 && c) {
			ctx.fillStyle = `rgba(255,255,255,${this.energy})`;
			if (this.energy > 0.79 && this.energy < 0.81) {
				c.pulse();
			}

			ctx.beginPath();
			ctx.moveTo(this.x, this.y);
			ctx.lineTo(c.x, c.y);
			ctx.stroke();
		}
		this.energy -= 0.05;
		this.energy = Math.max(this.energy, 0);
	}
}

Neuron.extraEnergy = 0;
let finished = false;

const sketch = ({ context, width, height }) => {
	const xSpacing = width / GRID_X;
	const ySpacing = height / GRID_Y;
	const neurons = [];
	for (var x = 0; x < GRID_X; x += 1) {
		for (var y = 0; y < GRID_Y; y += 1) {
			const n = new Neuron(x * xSpacing, y * ySpacing, x, y);
			neurons.push(n);
			map[y][x] = n;
		}
	}
	let pulseAt = 180;
	const pulseAll = () => {
		pulseAt = 180;
		map[0].forEach(n => n.pulse());
		if (finished) Neuron.extraEnergy = 0.5;
	};
	pulseAll();

	return ({ canvas, context, width, height }) => {
		// context.filter = "";
		context.globalCompositeOperation = "normal";
		const v = Math.sin(Math.PI * Neuron.extraEnergy) * 100;
		context.fillStyle = `rgb(${v}, ${v}, ${v})`;
		context.fillRect(0, 0, width, height);
		finished = true;
		neurons.forEach(n => {
			n.update();
			n.draw(context);
			finished = finished && n.offset() < 18;
		});
		pulseAt--;
		if (pulseAt == 0) {
			pulseAll();
		}
		Neuron.extraEnergy = Math.max(0, Neuron.extraEnergy - 0.01);
	};
};

canvasSketch(sketch, settings);
