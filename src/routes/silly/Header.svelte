<script lang="ts">
	import { onMount } from 'svelte';

	// This is deliberately fictional display copy, not a visitor counter or analytics measurement.
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
	<div class="retro-panel mb-4 bg-linear-to-r from-blue-600 to-purple-600 p-2 text-yellow-300">
		<div class="overflow-hidden" aria-label="Welcome to my awesome homepage">
			<span class="retro-marquee block text-2xl font-bold whitespace-nowrap">
				*** WELCOME TO MY AWESOME HOMEPAGE ***
			</span>
		</div>
	</div>

	<!-- Visitor counter -->
	<div class="retro-panel mb-4 bg-white p-2 text-center">
		<span class="mr-2 inline-block h-4 w-4 animate-pulse bg-red-500"></span>
		<span class="font-bold text-red-600">YOU ARE VISITOR NUMBER:</span>
		<span class="mx-2 bg-black px-3 py-1 font-mono text-xl text-lime-400">
			{visitorCount.toLocaleString()}
		</span>
		<span class="ml-2 inline-block h-4 w-4 animate-pulse bg-red-500"></span>
	</div>
</header>

<style>
	.retro-marquee {
		animation: marquee 12s linear infinite;
	}

	@keyframes marquee {
		from {
			transform: translateX(100%);
		}
		to {
			transform: translateX(-100%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.retro-marquee {
			animation: none;
			text-align: center;
		}
	}
</style>
