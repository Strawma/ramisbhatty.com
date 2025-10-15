<script lang="ts">
	import { onMount, getContext } from 'svelte';
	import type { BouncerManagerContext } from './BouncerManager.svelte';

	let { radius = 20, color = "", speed = 3, imageSrc = null } = $props();

	const context = getContext<BouncerManagerContext>('bouncerManager');

	onMount(() => {
		const id = crypto.randomUUID();
		const { width, height } = context.getCanvasDimensions();

		const bouncer = {
			id,
			x: Math.random() * (width - radius * 2) + radius,
			y: Math.random() * (height - radius * 2) + radius,
			vx: (Math.random() - 0.5) * speed,
			vy: (Math.random() - 0.5) * speed,
			radius,
			color,
			imageSrc
		};

		return context.registerBouncer(bouncer);
	});
</script>
