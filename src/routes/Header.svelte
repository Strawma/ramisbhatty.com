<script lang="ts">
	import { onMount } from 'svelte';

	let visitorCount = $state(Math.floor(Math.random() * 999999));

	onMount(() => {
		const interval = setInterval(() => {
			visitorCount = Math.floor(Math.random() * 999999);
		}, 3000);
		return () => clearInterval(interval);
	});
</script>

<header>
	<!-- Marquee banner -->
	<div class="bg-linear-to-r from-blue-600 to-purple-600 text-yellow-300 p-2 mb-4 retro-panel">
		<marquee class="text-2xl font-bold">*** WELCOME TO MY AWESOME HOMEPAGE ***</marquee>
	</div>

	<!-- Visitor counter -->
	<div class="bg-white retro-panel p-2 mb-4 text-center">
		<span class="inline-block w-4 h-4 bg-red-500 animate-pulse mr-2"></span>
		<span class="font-bold text-red-600">YOU ARE VISITOR NUMBER:</span>
		<span class="bg-black text-lime-400 px-3 py-1 font-mono text-xl mx-2">
      {visitorCount.toLocaleString()}
    </span>
		<span class="inline-block w-4 h-4 bg-red-500 animate-pulse ml-2"></span>
	</div>
</header>