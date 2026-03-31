<script lang="ts">
	import { onMount, setContext, type Snippet } from 'svelte';

	let canvas = $state<HTMLCanvasElement>();

	let {
		fps = 60,
		children,
	}: {
		fps?: number;
		children?: Snippet;
	} = $props();

	let viewportWidth = $state(0);
	let viewportHeight = $state(0);

	// ── Types ────────────────────────────────────────────

	interface BouncerConfig {
		id: string;
		size: number;
		speed: number;
		color: string;
		imageSrc: string | null;
	}

	interface Bouncer extends BouncerConfig {
		x: number;
		y: number;
		vx: number;
		vy: number;
		image: HTMLImageElement | null;
		initialized: boolean;
	}

	export interface BouncerManagerContext {
		registerBouncer: (config: BouncerConfig) => () => void;
	}

	// ── State ────────────────────────────────────────────

	const bouncers: Bouncer[] = [];
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

	// ── Context ──────────────────────────────────────────

	setContext<BouncerManagerContext>('bouncerManager', {
		registerBouncer: (config) => {
			const bouncer: Bouncer = {
				...config,
				x: 0,
				y: 0,
				vx: 0,
				vy: 0,
				image: null,
				initialized: false, // manager will position once it has dimensions
			};

			if (config.imageSrc) {
				loadImage(config.imageSrc).then((img) => {
					bouncer.image = img;
				});
			}

			bouncers.push(bouncer);

			return () => {
				const idx = bouncers.findIndex((b) => b.id === bouncer.id);
				if (idx !== -1) bouncers.splice(idx, 1);
			};
		},
	});

	// ── Helpers ──────────────────────────────────────────

	function getRadius(b: Bouncer): number {
		return b.size * Math.min(viewportWidth, viewportHeight);
	}

	function initBouncer(b: Bouncer) {
		const radius = getRadius(b);
		b.x = Math.random() * (viewportWidth - radius * 2) + radius;
		b.y = Math.random() * (viewportHeight - radius * 2) + radius;

		const adjustedSpeed = b.speed / fps;
		b.vx = (Math.random() - 0.5) * adjustedSpeed;
		b.vy = (Math.random() - 0.5) * adjustedSpeed;
		b.initialized = true;
	}

	// ── Physics ──────────────────────────────────────────

	function updatePhysics() {
		const w = viewportWidth;
		const h = viewportHeight;
		if (w === 0 || h === 0) return;

		for (const b of bouncers) {
			if (!b.initialized) initBouncer(b);

			const r = getRadius(b);

			b.x += b.vx;
			b.y += b.vy;

			if (b.x - r < 0) {
				b.vx = Math.abs(b.vx);
				b.x = r;
			} else if (b.x + r > w) {
				b.vx = -Math.abs(b.vx);
				b.x = w - r;
			}
			if (b.y - r < 0) {
				b.vy = Math.abs(b.vy);
				b.y = r;
			} else if (b.y + r > h) {
				b.vy = -Math.abs(b.vy);
				b.y = h - r;
			}
		}

		// Collisions
		for (let i = 0; i < bouncers.length; i++) {
			for (let j = i + 1; j < bouncers.length; j++) {
				const a = bouncers[i];
				const b = bouncers[j];
				const ra = getRadius(a);
				const rb = getRadius(b);
				const dx = b.x - a.x;
				const dy = b.y - a.y;
				const dist = Math.sqrt(dx * dx + dy * dy);
				const minDist = ra + rb;

				if (dist < minDist && dist > 0) {
					const nx = dx / dist;
					const ny = dy / dist;
					const overlap = (minDist - dist) / 2;

					a.x -= overlap * nx;
					a.y -= overlap * ny;
					b.x += overlap * nx;
					b.y += overlap * ny;

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

	// ── Rendering ────────────────────────────────────────

	function render(ctx: CanvasRenderingContext2D) {
		ctx.clearRect(0, 0, viewportWidth, viewportHeight);

		for (const b of bouncers) {
			if (!b.initialized) continue;

			const r = getRadius(b);

			if (b.image) {
				ctx.drawImage(b.image, b.x - r, b.y - r, r * 2, r * 2);
			} else if (b.color) {
				ctx.beginPath();
				ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
				ctx.fillStyle = b.color;
				ctx.fill();
			}
		}
	}

	// ── Lifecycle ────────────────────────────────────────

	onMount(() => {
		const ctx = canvas!.getContext('2d')!;

		function handleResize() {
			viewportWidth = window.innerWidth;
			viewportHeight = window.innerHeight;
			canvas!.width = viewportWidth;
			canvas!.height = viewportHeight;
		}

		handleResize();
		window.addEventListener('resize', handleResize);

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
			window.removeEventListener('resize', handleResize);
		};
	});
</script>

<!-- Canvas sits between background and content -->
<canvas
	bind:this={canvas}
	class="fixed inset-0 pointer-events-none z-10"
></canvas>

<!-- Bouncer registrations (render nothing visible) -->
{#if children}
	{@render children()}
{/if}