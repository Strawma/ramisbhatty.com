<script lang="ts">
	import { onMount } from 'svelte';

	const maxWidth = 150;
	const maxHeight = 150;
	let width = maxWidth;
	let height = maxHeight;
	const minSpeed = 100;
	const maxSpeed = 400;
	export let name: string = "Bouncer";
	export let src: string = "";
	export let bounceSrc: string | null = null;
	export let initialX = 0;
	export let initialY = 0;
	export let fps = 8;

	let x = initialX;
	let y = initialY;
	let dx = Math.floor(Math.random() * maxSpeed) + minSpeed;
	let dy = Math.floor(Math.random() * maxSpeed) + minSpeed;
	let animationFrame: number;
	let lastTime = performance.now();
	let totalTime = 0;

	let canvasEl: HTMLCanvasElement | null = null;
	const pixelResolution = 16; // smaller -> blockier edges

	function adjustSize() {
		width = Math.min(maxWidth, window.innerWidth);
		height = Math.min(maxHeight, window.innerHeight);
	}

	function renderPixelCircle() {
		if (!canvasEl || !src) return;
		const ctx = canvasEl.getContext('2d');
		if (!ctx) return;

		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.src = src;

		img.onload = () => {
			if (!canvasEl) return;

			// internal low-res canvas size
			canvasEl.width = pixelResolution;
			canvasEl.height = pixelResolution;

			// draw the image scaled to cover the small canvas
			ctx.clearRect(0, 0, pixelResolution, pixelResolution);
			const scale = Math.max(pixelResolution / img.width, pixelResolution / img.height);
			const dw = img.width * scale;
			const dh = img.height * scale;
			const dxImg = (pixelResolution - dw) / 2;
			const dyImg = (pixelResolution - dh) / 2;
			ctx.drawImage(img, dxImg, dyImg, dw, dh);

			// mask to a circle (hard edges)
			ctx.globalCompositeOperation = 'destination-in';
			ctx.beginPath();
			ctx.arc(pixelResolution / 2, pixelResolution / 2, pixelResolution / 2, 0, Math.PI * 2);
			ctx.fill();
			ctx.globalCompositeOperation = 'source-over';
		};
	}

	// play bounce sound
	function playBounceSound() {
		if (!bounceSrc) return;
		const s = new Audio(bounceSrc);
		s.play();
	}

	function moveBouncer(timestamp: number) {
		const deltaTime = timestamp - lastTime;
		lastTime = timestamp;
		totalTime += deltaTime;

		if (totalTime >= 1000 / fps) {
			totalTime = 0;
			const leftBoundary = 0;
			const topBoundary = 0;
			const rightBoundary = window.innerWidth;
			const bottomBoundary = document.documentElement.scrollHeight;

			x += dx / fps;
			y += dy / fps;

			let bounced = false;
			if (x <= leftBoundary) {
				dx = Math.abs(dx);
				x = leftBoundary;
				bounced = true;
			} else if (x + width >= rightBoundary) {
				dx = -Math.abs(dx);
				x = rightBoundary - width;
				bounced = true;
			}

			if (y <= topBoundary) {
				dy = Math.abs(dy);
				y = topBoundary;
				bounced = true;
			} else if (y + height >= bottomBoundary) {
				dy = -Math.abs(dy);
				y = bottomBoundary - height;
				bounced = true;
			}

			if (bounced) {
				playBounceSound();
			}
		}

		animationFrame = requestAnimationFrame(moveBouncer);
	}

	onMount(() => {
		adjustSize();
		renderPixelCircle();
		// re-render when window resizes (keeps pixelated size consistent)
		const onResize = () => {
			adjustSize();
			renderPixelCircle();
		};
		window.addEventListener('resize', onResize);

		animationFrame = requestAnimationFrame(moveBouncer);

		return () => {
			cancelAnimationFrame(animationFrame);
			window.removeEventListener('resize', onResize);
		};
	});

	$: if (src) {
		renderPixelCircle();
	}
</script>

<button
	class="bg-transparent border-0 p-0 cursor-pointer absolute focus:outline-none focus:ring-2 focus:ring-black block z-50"
	style="left: {x}px; top: {y}px;"
	on:click
	aria-label={name}

>
	<canvas
		bind:this={canvasEl}
		style="width: {width}px; height: {height}px; image-rendering: pixelated; display: block;"
		aria-label={name}
	></canvas>
</button>