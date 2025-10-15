<script lang="ts">
	import { onMount, getContext } from 'svelte';

	export let radius = 20;
	export let color = '#ff6b6b';
	export let speed = 3;

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
			color
		};

		return context.registerBouncer(bouncer);
	});
</script>
