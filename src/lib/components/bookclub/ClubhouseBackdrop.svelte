<script lang="ts">
	import { onMount } from 'svelte';

	const DESKTOP_SHAPE_COUNT = 80;
	const MOBILE_SHAPE_COUNT = 20;
	const shapeTypes = ['square', 'circle', 'triangle'] as const;
	type ShapeType = (typeof shapeTypes)[number];

	type Shape = {
		type: ShapeType;
		left: number;
		staticTop: number;
		size: number;
		duration: number;
		phase: number;
		drift: number;
		spin: number;
		breathDuration: number;
		breathPhase: number;
		breathScale: number;
		opacity: number;
	};

	let canvas: HTMLCanvasElement;
	let shapes: Shape[] = [];
	let context: CanvasRenderingContext2D | null = null;
	let width = 0;
	let height = 0;
	let reducedMotion = false;
	let frame: number | null = null;

	function randomBetween(min: number, max: number): number {
		return min + Math.random() * (max - min);
	}

	function createShapes(): Shape[] {
		return Array.from({ length: DESKTOP_SHAPE_COUNT }, () => ({
			type: shapeTypes[Math.floor(Math.random() * shapeTypes.length)],
			left: randomBetween(-4, 96),
			staticTop: randomBetween(8, 88),
			size: randomBetween(28, 92),
			duration: randomBetween(35, 72),
			phase: randomBetween(0, 72),
			drift: randomBetween(-180, 180),
			spin: randomBetween(-220, 220),
			breathDuration: randomBetween(3.5, 7),
			breathPhase: randomBetween(0, 7),
			breathScale: randomBetween(1.03, 1.1),
			opacity: randomBetween(0.14, 0.32)
		}));
	}

	function resizeCanvas(): void {
		if (!canvas) return;

		const bounds = canvas.getBoundingClientRect();
		const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
		const pixelWidth = Math.max(1, Math.round(bounds.width * pixelRatio));
		const pixelHeight = Math.max(1, Math.round(bounds.height * pixelRatio));

		width = bounds.width;
		height = bounds.height;

		if (canvas.width === pixelWidth && canvas.height === pixelHeight && context) return;

		canvas.width = pixelWidth;
		canvas.height = pixelHeight;
		context = canvas.getContext('2d');
		context?.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
	}

	function drawRoundedSquare(size: number): void {
		const radius = size * 0.08;
		const edge = size * 0.76;
		const start = -edge / 2;

		context?.beginPath();
		context?.roundRect(start, start, edge, edge, radius);
	}

	function drawTriangle(size: number): void {
		const half = size * 0.4;
		const top = -size * 0.4;

		context?.beginPath();
		context?.moveTo(0, top);
		context?.lineTo(half, size * 0.36);
		context?.lineTo(-half, size * 0.36);
		context?.closePath();
	}

	function drawShape(shape: Shape, time: number): void {
		if (!context) return;

		const progress = reducedMotion ? 0 : ((time + shape.phase) % shape.duration) / shape.duration;
		const fade = Math.min(progress / 0.1, (1 - progress) / 0.12, 1);
		const breath = reducedMotion
			? 1
			: 0.94 +
				(shape.breathScale - 0.94) *
					(0.5 + 0.5 * Math.sin(((time + shape.breathPhase) / shape.breathDuration) * Math.PI * 2));
		const size = shape.size * breath;
		const x = (shape.left / 100) * width + size / 2 + (reducedMotion ? 0 : shape.drift * progress);
		const y = reducedMotion
			? (shape.staticTop / 100) * height + size / 2
			: ((105 - 145 * progress) / 100) * height + size / 2;

		context.save();
		context.translate(x, y);
		context.rotate(reducedMotion ? 0 : (shape.spin * progress * Math.PI) / 180);
		context.globalAlpha = reducedMotion ? shape.opacity : shape.opacity * fade;
		context.fillStyle = 'rgb(255 255 255 / 0.04)';
		context.strokeStyle = 'white';
		context.lineCap = 'round';
		context.lineJoin = 'round';
		context.lineWidth = Math.max(1.5, size * 0.055);
		context.setLineDash(
			shape.type === 'circle'
				? [size * 0.11, size * 0.04, size * 0.03, size * 0.05]
				: [size * 0.07, size * 0.03, size * 0.02, size * 0.04]
		);

		if (shape.type === 'circle') {
			context.beginPath();
			context.arc(0, 0, size * 0.38, 0, Math.PI * 2);
		} else if (shape.type === 'triangle') {
			drawTriangle(size);
		} else {
			drawRoundedSquare(size);
		}

		context.fill();
		context.stroke();
		context.restore();
	}

	function draw(time: number): void {
		if (!context || width === 0 || height === 0) return;

		context.clearRect(0, 0, width, height);
		const shapeCount = width <= 640 ? MOBILE_SHAPE_COUNT : DESKTOP_SHAPE_COUNT;

		for (const shape of shapes.slice(0, shapeCount)) drawShape(shape, time);
	}

	function render(timestamp: number): void {
		frame = null;
		draw(timestamp / 1000);

		if (!reducedMotion && !document.hidden) frame = requestAnimationFrame(render);
	}

	onMount(() => {
		shapes = createShapes();
		resizeCanvas();

		const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
		const updateMotionPreference = () => {
			reducedMotion = motionPreference.matches;
			if (reducedMotion && frame !== null) {
				cancelAnimationFrame(frame);
				frame = null;
			}
			draw(performance.now() / 1000);
			if (!reducedMotion && !document.hidden && frame === null) {
				frame = requestAnimationFrame(render);
			}
		};
		const handleVisibilityChange = () => {
			if (document.hidden) {
				if (frame !== null) cancelAnimationFrame(frame);
				frame = null;
			} else if (!reducedMotion && frame === null) {
				frame = requestAnimationFrame(render);
			}
		};
		const resizeObserver = new ResizeObserver(() => {
			resizeCanvas();
			draw(performance.now() / 1000);
		});

		motionPreference.addEventListener('change', updateMotionPreference);
		document.addEventListener('visibilitychange', handleVisibilityChange);
		resizeObserver.observe(canvas);
		updateMotionPreference();

		return () => {
			if (frame !== null) cancelAnimationFrame(frame);
			motionPreference.removeEventListener('change', updateMotionPreference);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			resizeObserver.disconnect();
		};
	});
</script>

<div class="clubhouse-backdrop" aria-hidden="true">
	<canvas bind:this={canvas}></canvas>
</div>

<style>
	.clubhouse-backdrop {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
	}

	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
