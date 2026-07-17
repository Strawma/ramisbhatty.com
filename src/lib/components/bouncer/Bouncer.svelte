<script lang="ts">
	import { onMount, getContext } from 'svelte';
	import type { BouncerManagerContext } from './BouncerManager.svelte';

	let {
		size = 0.03,
		color = '',
		speed = 300,
		imageSrc = null
	}: {
		size?: number; // fraction of min(vw, vh), e.g. 0.03 = 3%
		color?: string;
		speed?: number;
		imageSrc?: string | null;
	} = $props();

	const context = getContext<BouncerManagerContext>('bouncerManager');

	onMount(() => {
		// The manager owns mutable physics state; this component contributes a config and unregisters it
		// when the component leaves the page.
		return context.registerBouncer({
			id: crypto.randomUUID(),
			size,
			speed,
			color,
			imageSrc
		});
	});
</script>
