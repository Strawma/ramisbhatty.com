<script lang="ts">
	import { onMount, getContext } from 'svelte';

	let { radius = 20, color = '#ff6b6b', speed = 3, imageSrc = null } = $props();

	const context = getContext('bouncerManager');

	onMount(() => {
		const id = Math.random().toString(36);
		const bouncer = {
			id,
			x: Math.random() * 700 + 50,
			y: Math.random() * 500 + 50,
			vx: (Math.random() - 0.5) * speed,
			vy: (Math.random() - 0.5) * speed,
			radius,
			color,
			imageSrc
		};

		return context.registerBouncer(bouncer);
	});
</script>
