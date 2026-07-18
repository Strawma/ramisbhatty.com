<script lang="ts">
	import { onMount } from 'svelte';

	const shapeTypes = ['square', 'circle', 'triangle'] as const;
	type ShapeType = (typeof shapeTypes)[number];

	type Shape = {
		id: number;
		type: ShapeType;
		left: number;
		top: number;
		staticTop: number;
		size: number;
		duration: number;
		delay: number;
		drift: number;
		spin: number;
		breathDuration: number;
		breathDelay: number;
		breathScale: number;
		opacity: number;
	};

	let shapes = $state<Shape[]>([]);

	function randomBetween(min: number, max: number): number {
		return min + Math.random() * (max - min);
	}

	onMount(() => {
		shapes = Array.from({ length: 30 }, (_, id) => ({
			id,
			type: shapeTypes[Math.floor(Math.random() * shapeTypes.length)],
			left: randomBetween(-4, 96),
			top: randomBetween(105, 125),
			staticTop: randomBetween(8, 88),
			size: randomBetween(28, 92),
			duration: randomBetween(35, 72),
			delay: randomBetween(-72, 0),
			drift: randomBetween(-180, 180),
			spin: randomBetween(-220, 220),
			breathDuration: randomBetween(3.5, 7),
			breathDelay: randomBetween(-7, 0),
			breathScale: randomBetween(1.03, 1.1),
			opacity: randomBetween(0.14, 0.32)
		}));
	});
</script>

<div class="clubhouse-backdrop" aria-hidden="true">
	<svg class="clubhouse-filter" aria-hidden="true" focusable="false">
		<filter id="clubhouse-chalk" x="-10%" y="-10%" width="120%" height="120%">
			<feTurbulence
				type="fractalNoise"
				baseFrequency="0.035 0.08"
				numOctaves="2"
				seed="11"
				result="chalk-noise"
			/>
			<feDisplacementMap
				in="SourceGraphic"
				in2="chalk-noise"
				scale="1.5"
				xChannelSelector="R"
				yChannelSelector="G"
			/>
		</filter>
	</svg>

	{#each shapes as shape (shape.id)}
		<div
			class="shape shape-{shape.type}"
			style={`--left: ${shape.left}%; --top: ${shape.top}%; --static-top: ${shape.staticTop}%; --size: ${shape.size}px; --duration: ${shape.duration}s; --delay: ${shape.delay}s; --drift: ${shape.drift}px; --spin: ${shape.spin}deg; --breath-duration: ${shape.breathDuration}s; --breath-delay: ${shape.breathDelay}s; --breath-scale: ${shape.breathScale}; --opacity: ${shape.opacity};`}
		>
			<svg class="shape-art" viewBox="0 0 100 100" focusable="false">
				{#if shape.type === 'square'}
					<rect x="12" y="12" width="76" height="76" rx="8" />
				{:else if shape.type === 'circle'}
					<circle cx="50" cy="50" r="38" />
				{:else}
					<polygon points="50,10 90,86 10,86" />
				{/if}
			</svg>
		</div>
	{/each}
</div>

<style>
	.clubhouse-backdrop {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
	}

	.clubhouse-filter {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
	}

	.shape {
		position: absolute;
		top: var(--top);
		left: var(--left);
		width: var(--size);
		height: var(--size);
		animation: drift var(--duration) linear var(--delay) infinite;
		will-change: transform, opacity;
	}

	.shape-art {
		width: 100%;
		height: 100%;
		animation: breathe var(--breath-duration) ease-in-out var(--breath-delay) infinite;
		filter: url('#clubhouse-chalk');
		transform-origin: center;
		will-change: transform;
	}

	.shape rect,
	.shape circle,
	.shape polygon {
		fill: rgb(255 255 255 / 0.04);
		stroke: white;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 5.5;
		stroke-dasharray: 7 3 2 4;
	}

	.shape circle {
		stroke-dasharray: 11 4 3 5;
	}

	.shape polygon {
		stroke-dasharray: 8 3 2 5;
	}

	@keyframes drift {
		from {
			opacity: 0;
			transform: translate3d(0, 0, 0) rotate(0deg);
		}
		10% {
			opacity: var(--opacity);
		}
		88% {
			opacity: var(--opacity);
		}
		to {
			opacity: 0;
			transform: translate3d(var(--drift), -145vh, 0) rotate(var(--spin));
		}
	}

	@keyframes breathe {
		0%,
		100% {
			transform: scale(0.94);
		}
		50% {
			transform: scale(var(--breath-scale));
		}
	}

	@media (max-width: 640px) {
		.shape:nth-of-type(n + 20) {
			display: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.shape {
			top: var(--static-top);
			opacity: var(--opacity);
			animation: none;
		}

		.shape-art {
			animation: none;
			transform: scale(1);
		}
	}
</style>
