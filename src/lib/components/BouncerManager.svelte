<script lang="ts">
	import { onMount, setContext } from 'svelte';

	let canvas = $state<HTMLCanvasElement>();
	let container = $state<HTMLDivElement>();

	let { width = 800, height = 600, fps = 60 } = $props();

	let numericWidth = $state(800);
	let numericHeight = $state(600);

	interface Bouncer {
		id: string;
		x: number;
		y: number;
		vx: number;
		vy: number;
		radius: number;
		color: string;
		imageSrc: string | null;
	}

	let bouncers = $state<Bouncer[]>([]);
	let obstacles = $state<DOMRect[]>([]);

	setContext('bouncerManager', {
		registerBouncer: (bouncer: Bouncer) => {
			bouncers = [...bouncers, bouncer];
			return () => {
				bouncers = bouncers.filter(item => item.id !== bouncer.id);
			};
		},
		registerObstacle: (rect: DOMRect) => {
			obstacles = [...obstacles, rect];
		}
	});

	function updatePhysics() {
		bouncers = bouncers.map(bouncer => {
			let { x, y, vx, vy, radius } = bouncer;

			x += vx;
			y += vy;

			if (x - radius < 0 || x + radius > numericWidth) {
				vx = -vx;
				x = x - radius < 0 ? radius : numericWidth - radius;
			}
			if (y - radius < 0 || y + radius > numericHeight) {
				vy = -vy;
				y = y - radius < 0 ? radius : numericHeight - radius;
			}

			return { ...bouncer, x, y, vx, vy };
		});

		// Check collisions
		for (let i = 0; i < bouncers.length; i++) {
			for (let j = i + 1; j < bouncers.length; j++) {
				const b1 = bouncers[i];
				const b2 = bouncers[j];
				const dx = b2.x - b1.x;
				const dy = b2.y - b1.y;
				const distance = Math.sqrt(dx * dx + dy * dy);

				if (distance < b1.radius + b2.radius) {
					const angle = Math.atan2(dy, dx);
					const sin = Math.sin(angle);
					const cos = Math.cos(angle);

					const overlap = b1.radius + b2.radius - distance;
					b1.x -= (overlap / 2) * cos;
					b1.y -= (overlap / 2) * sin;
					b2.x += (overlap / 2) * cos;
					b2.y += (overlap / 2) * sin;

					[b1.vx, b2.vx] = [b2.vx, b1.vx];
					[b1.vy, b2.vy] = [b2.vy, b1.vy];
				}
			}
		}
	}

	onMount(() => {
		const updateDimensions = () => {
			if (container) {
				numericWidth = container.offsetWidth;
				numericHeight = container.offsetHeight;
			}
		};

		updateDimensions();
		window.addEventListener('resize', updateDimensions);

		const interval = setInterval(updatePhysics, 1000 / fps);

		return () => {
			clearInterval(interval);
			window.removeEventListener('resize', updateDimensions);
		};
	});
</script>

<div bind:this={container} class="bouncer-manager" style="width: {width}px; height: {height}px;">
	<canvas bind:this={canvas} width={numericWidth} height={numericHeight}></canvas>
	<div class="content">
		<slot></slot>
	</div>
	{#each bouncers as bouncer (bouncer.id)}
		<div
			class="bouncer-visual"
			style="left: {bouncer.x - bouncer.radius}px; top: {bouncer.y - bouncer.radius}px; width: {bouncer.radius * 2}px; height: {bouncer.radius * 2}px; background: {bouncer.color};"
		>
			{#if bouncer.imageSrc}
				<img src={bouncer.imageSrc} alt="Bouncer" class="bouncer-image" />
			{/if}
		</div>
	{/each}
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

  .bouncer-visual {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
  }

  .bouncer-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }
</style>
