const canvasSketch = require("canvas-sketch");
const { rand } = require("../util");
const settings = {
	dimensions: [2048, 2048],
	animate: true
};
const NEURON_SIZE = 5;
const NEURON_SPACING = 60;
const NEURON_JITTER = 20;
const NERUON_REACH = 80;

let nextPulses = new Map();
class Neuron {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.energy = 0;
		this.pulsing = false;

		this.targets = [];
		// Ensure we don't keep pulsing back and forth,
		this.pulseMap = {};
	}

	draw(ctx) {
		ctx.fillStyle = `rgba(255,255,255,${this.energy * 0.8 + 0.2})`;
		// ctx.strokeStyle = "gradient(red, white)";
		ctx.lineWidth = 3;
		ctx.beginPath();
		ctx.arc(this.x, this.y, NEURON_SIZE, 0, Math.PI * 2);
		ctx.fill();
		if (this.energy > 0) {
			ctx.strokeStyle = `rgba(255,0,0,${Math.sqrt(this.energy)})`;
			ctx.arc(
				this.x,
				this.y,
				NEURON_SIZE + 20 * (1 - this.energy),
				0,
				Math.PI * 2
			);
			ctx.stroke();
			ctx.strokeStyle = `rgba(255,255,255,${this.energy})`;
			ctx.beginPath();
			this.targets.forEach(target => {
				if (this.energy > 0.8) {
					// target.pulse(this.currentPulse);
					if (Math.random() > 0.6) nextPulses.set(target, this.currentPulse);
				}
				// ctx.beginPath();
				ctx.moveTo(this.x, this.y);
				ctx.lineTo(target.x, target.y);
			});
			ctx.stroke();
		}
		this.pulsing = false;
		this.energy -= 0.05;
		this.energy = Math.max(0, this.energy);
	}

	pulse(key) {
		if (this.pulseMap[key]) return;
		this.pulsing = true;
		this.currentPulse = key;
		this.energy = 1;
		this.pulseMap[key] = true;
	}

	distance(other) {
		const dx = this.x - other.x;
		const dy = this.y - other.y;
		return Math.sqrt(dx * dx + dy * dy);
	}
}

const sketch = ({ context, width, height }) => {
	const neurons = [];
	for (var x = 0; x <= width; x += NEURON_SPACING) {
		for (var y = 0; y <= height; y += NEURON_SPACING) {
			neurons.push(
				new Neuron(x + rand(NEURON_JITTER), y + rand(NEURON_JITTER))
			);
		}
	}

	for (var i = 0; i < neurons.length; i++) {
		const a = neurons[i];
		for (var j = i + 1; j < neurons.length; j++) {
			const b = neurons[j];
			if (a.distance(b) < NERUON_REACH) {
				a.targets.push(b);
			}
		}
	}

	setInterval(function() {
		neurons.forEach(n => {
			if (Math.random() > 0.995) {
				n.pulse(new String(Math.random()));
			}
		});
	}, 1000);

	return ({ canvas, context, width, height }) => {
		// context.filter = "";
		context.globalCompositeOperation = "normal";
		context.fillStyle = "black";
		context.fillRect(0, 0, width, height);
		nextPulses.forEach((pulseKey, target) => {
			target.pulse(pulseKey);
		});
		nextPulses.clear();
		neurons.forEach(n => n.draw(context));
		context.globalCompositeOperation = "lighten";
		context.drawImage(canvas, 0, 0);
	};
};

canvasSketch(sketch, settings);
