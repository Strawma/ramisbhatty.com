<script lang="ts">
	import { onMount, getContext } from 'svelte';
	import type { BouncerManagerContext } from './BouncerManager.svelte';

	let { radius = 20, color = '', speed = 3, imageSrc = null } = $props();

	const context = getContext<BouncerManagerContext>('bouncerManager');

	onMount(() => {
		const { width, height } = context.getCanvasDimensions();
		const adjustedSpeed = speed / context.getFPS();

		// registerBouncer now accepts Omit<Bouncer, 'image'>
		// manager handles image loading internally
		return context.registerBouncer({
			id: crypto.randomUUID(),
			x: Math.random() * (width - radius * 2) + radius,
			y: Math.random() * (height - radius * 2) + radius,
			vx: (Math.random() - 0.5) * adjustedSpeed,
			vy: (Math.random() - 0.5) * adjustedSpeed,
			radius,
			color,
			imageSrc,
		});
	});
</script>