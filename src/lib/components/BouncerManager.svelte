<script lang="ts">
	import { onMount, setContext } from 'svelte';
	import type { Writable } from 'svelte/store';
	import { writable } from 'svelte/store';

	let canvas: HTMLCanvasElement;
	let container: HTMLDivElement;
	export let width: number | string = 800;
	export let height: number | string = 600;

	let numericWidth = 800;
	let numericHeight = 600;

	interface Bouncer {
		id: string;
		x: number;
		y: number;
		vx: number;
		vy: number;
		radius: number;
		color: string;
	}

	const bouncers: Writable<Bouncer[]> = writable([]);
	const obstacles: Writable<DOMRect[]> = writable([]);

	setContext('bouncerManager', {
		registerBouncer: (bouncer: Bouncer) => {
			bouncers.update(b => [...b, bouncer]);
			return () => bouncers.update(b => b.filter(item => item.id !== bouncer.id));
		},
		registerObstacle: (rect: DOMRect) => {
			obstacles.update(o => [...o, rect]);
		}
	});

	function updatePhysics() {
		bouncers.update(items => {
			return items.map(bouncer => {
				let { x, y, vx, vy, radius } = bouncer;

				// Apply gravity/movement
				x += vx;
				y += vy;

				// Bounce off walls
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
		});

		// Check bouncer-to-bouncer collisions
		bouncers.update(items => {
			for (let i = 0; i < items.length; i++) {
				for (let j = i + 1; j < items.length; j++) {
					const b1 = items[i];
					const b2 = items[j];
					const dx = b2.x - b1.x;
					const dy = b2.y - b1.y;
					const distance = Math.sqrt(dx * dx + dy * dy);

					if (distance < b1.radius + b2.radius) {
						// Collision detected - swap velocities (simplified)
						const angle = Math.atan2(dy, dx);
						const sin = Math.sin(angle);
						const cos = Math.cos(angle);

						// Separate bouncers
						const overlap = b1.radius + b2.radius - distance;
						b1.x -= (overlap / 2) * cos;
						b1.y -= (overlap / 2) * sin;
						b2.x += (overlap / 2) * cos;
						b2.y += (overlap / 2) * sin;

						// Exchange velocities
						[b1.vx, b2.vx] = [b2.vx, b1.vx];
						[b1.vy, b2.vy] = [b2.vy, b1.vy];
					}
				}
			}
			return items;
		});
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

		const interval = setInterval(updatePhysics, 1000 / 60);

		return () => {
			clearInterval(interval);
			window.removeEventListener('resize', updateDimensions);
		};
	});
</script>

<div bind:this={container} class="bouncer-manager" style="width: {width}px; height: {height}px;">
	<canvas bind:this={canvas} {numericWidth} {numericHeight}></canvas>
	<div class="content">
		<slot></slot>
	</div>
	{#each $bouncers as bouncer (bouncer.id)}
		<div
			class="bouncer-visual"
			style="left: {bouncer.x - bouncer.radius}px; top: {bouncer.y - bouncer.radius}px; width: {bouncer.radius * 2}px; height: {bouncer.radius * 2}px; background: {bouncer.color};"
		></div>
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
</style>
