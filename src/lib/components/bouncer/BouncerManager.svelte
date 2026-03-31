<script lang="ts">
	import { onMount, setContext, type Snippet } from 'svelte';

	let canvas = $state<HTMLCanvasElement>();
	let container = $state<HTMLDivElement>();

	let {
		width = '1000px',
		height = '1000px',
		fps = 60,
		children,
	}: {
		width?: string;
		height?: string;
		fps?: number;
		children?: Snippet;
	} = $props();

	let numericWidth = $state(1000);
	let numericHeight = $state(1000);
	let previousWidth = $state(1000);
	let previousHeight = $state(1000);

	// ---------- Types ----------

	interface Bouncer {
		id: string;
		x: number;
		y: number;
		vx: number;
		vy: number;
		radius: number;
		color: string;
		imageSrc: string | null;
		image: HTMLImageElement | null;
	}

	export interface BouncerManagerContext {
		getCanvasDimensions: () => { width: number; height: number };
		getFPS: () => number;
		registerBouncer: (bouncer: Omit<Bouncer, 'image'>) => () => void;
	}

	// ---------- State ----------

	// Plain array — no need for Svelte reactivity since
	// canvas rendering is imperative, not template-driven
	let bouncers: Bouncer[] = [];

	// Cache loaded images so 15 bouncers sharing the same
	// sprite only trigger one network request
	const imageCache = new Map<string, HTMLImageElement>();

	function loadImage(src: string): Promise<HTMLImageElement> {
		const cached = imageCache.get(src);
		if (cached) return Promise.resolve(cached);

		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => {
				imageCache.set(src, img);
				resolve(img);
			};
			img.onerror = reject;
			img.src = src;
		});
	}

	// ---------- Context ----------

	setContext<BouncerManagerContext>('bouncerManager', {
		getCanvasDimensions: () => ({ width: numericWidth, height: numericHeight }),
		getFPS: () => fps,
		registerBouncer: (bouncer) => {
			const entry: Bouncer = { ...bouncer, image: null };

			if (bouncer.imageSrc) {
				loadImage(bouncer.imageSrc).then((img) => {
					entry.image = img;
				});
			}

			bouncers.push(entry);

			// Return cleanup function (called on Bouncer unmount)
			return () => {
				const idx = bouncers.findIndex((b) => b.id === entry.id);
				if (idx !== -1) bouncers.splice(idx, 1);
			};
		},
	});

	// Physics (mutate in place - no allocations per frame)

	function updatePhysics() {
		const w = numericWidth;
		const h = numericHeight;

		for (const b of bouncers) {
			b.x += b.vx;
			b.y += b.vy;

			if (b.x - b.radius < 0) {
				b.vx = Math.abs(b.vx);
				b.x = b.radius;
			} else if (b.x + b.radius > w) {
				b.vx = -Math.abs(b.vx);
				b.x = w - b.radius;
			}

			if (b.y - b.radius < 0) {
				b.vy = Math.abs(b.vy);
				b.y = b.radius;
			} else if (b.y + b.radius > h) {
				b.vy = -Math.abs(b.vy);
				b.y = h - b.radius;
			}
		}

		// Collisions
		for (let i = 0; i < bouncers.length; i++) {
			for (let j = i + 1; j < bouncers.length; j++) {
				const a = bouncers[i];
				const b = bouncers[j];
				const dx = b.x - a.x;
				const dy = b.y - a.y;
				const dist = Math.sqrt(dx * dx + dy * dy);
				const minDist = a.radius + b.radius;

				if (dist < minDist && dist > 0) {
					const nx = dx / dist;
					const ny = dy / dist;
					const overlap = (minDist - dist) / 2;

					a.x -= overlap * nx;
					a.y -= overlap * ny;
					b.x += overlap * nx;
					b.y += overlap * ny;

					// Swap velocities along collision normal
					const dvx = a.vx - b.vx;
					const dvy = a.vy - b.vy;
					const dot = dvx * nx + dvy * ny;

					a.vx -= dot * nx;
					a.vy -= dot * ny;
					b.vx += dot * nx;
					b.vy += dot * ny;
				}
			}
		}
	}

	// ---------- Rendering ----------

	function render(ctx: CanvasRenderingContext2D) {
		ctx.clearRect(0, 0, numericWidth, numericHeight);

		for (const b of bouncers) {
			if (b.image) {
				// Draw the sprite
				ctx.drawImage(
					b.image,
					b.x - b.radius,
					b.y - b.radius,
					b.radius * 2,
					b.radius * 2,
				);
			} else if (b.color) {
				// Fallback: colored circle
				ctx.beginPath();
				ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
				ctx.fillStyle = b.color;
				ctx.fill();
			}
		}
	}

	// ---------- Lifecycle ----------

	onMount(() => {
		const ctx = canvas!.getContext('2d')!;

		function updateDimensions() {
			if (!container) return;

			const newW = container.offsetWidth;
			const newH = container.offsetHeight;

			if (previousWidth > 0 && previousHeight > 0) {
				const scaleX = newW / previousWidth;
				const scaleY = newH / previousHeight;

				for (const b of bouncers) {
					b.x *= scaleX;
					b.y *= scaleY;
					b.vx *= scaleX;
					b.vy *= scaleY;
					b.radius *= scaleX;
				}
			}

			numericWidth = newW;
			numericHeight = newH;
			previousWidth = newW;
			previousHeight = newH;

			// Sync canvas buffer size with display size
			canvas!.width = newW;
			canvas!.height = newH;
		}

		updateDimensions();
		window.addEventListener('resize', updateDimensions);

		// ---------- Animation Loop with FPS Control ----------
		let animFrame: number;
		let lastTime = 0;
		const frameInterval = 1000 / fps;

		function loop(timestamp: number) {
			animFrame = requestAnimationFrame(loop);

			if (timestamp - lastTime < frameInterval) return;
			lastTime = timestamp;

			updatePhysics();
			render(ctx);
		}

		animFrame = requestAnimationFrame(loop);

		return () => {
			cancelAnimationFrame(animFrame);
			window.removeEventListener('resize', updateDimensions);
		};
	});
</script>

<div bind:this={container} class="bouncer-manager" style="width: {width}; height: {height};">
	<canvas bind:this={canvas} width={numericWidth} height={numericHeight}></canvas>
	<div class="content">
		{#if children}
			{@render children()}
		{/if}
	</div>
	<!-- Bouncers are now drawn on the canvas -->
</div>

<style>
  .bouncer-manager {
    position: relative;
    overflow: hidden;
  }

  canvas {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
  }

  .content {
    position: relative;
    width: 100%;
    height: 100%;
  }
</style>