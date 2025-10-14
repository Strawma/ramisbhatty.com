<script lang="ts">
	import { onMount } from 'svelte';

	const maxWidth = 150;
	const maxHeight = 150;
	let width: number;
	let height: number;
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
		// adjust size of bouncer if window size changes
		adjustSize();

		const deltaTime = timestamp - lastTime;
		lastTime = timestamp;
		totalTime += deltaTime;

		if (totalTime >= 1000 / fps) {
			totalTime = 0;
			const containerRect = document.documentElement.getBoundingClientRect();
			let leftBoundary = containerRect.left;
			let topBoundary = containerRect.top;
			let rightBoundary = containerRect.right;
			let bottomBoundary = containerRect.bottom;

			x += dx / fps;
			y += dy / fps;

			let bounced = false;
			if (x + window.scrollX <= leftBoundary) {
				dx = Math.abs(dx);
				x = 0;
				bounced = true;
			} else if (x + width + window.scrollX >= rightBoundary) {
				dx = -Math.abs(dx);
				x = window.innerWidth - width;
				bounced = true;
			}

			if (y + window.scrollY <= topBoundary) {
				dy = Math.abs(dy);
				y = 0;
				bounced = true;
			} else if (y + height + window.scrollY >= bottomBoundary) {
				dy = -Math.abs(dy);
				y = window.innerHeight - height;
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
	class="bg-transparent border-0 p-0 cursor-pointer absolute focus:outline-none focus:ring-2 focus:ring-black block"
	style="left: {x}px; top: {y}px;"
	on:click
>
	<!-- canvas is rendered at a low internal resolution and scaled up with pixelated rendering -->
	<canvas
		bind:this={canvasEl}
		style="width: {width}px; height: {height}px; image-rendering: pixelated; display: block;"
		aria-label={name}
	/>
</button>