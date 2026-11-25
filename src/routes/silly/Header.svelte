<script lang="ts">
	let { horror = false }: { horror?: boolean } = $props();

	// This is deliberately fictional display copy, not a visitor counter or analytics measurement.
	let visitorCount = $state(Math.floor(Math.random() * 999999));
</script>

<header>
	<!-- Marquee banner -->
	<div
		class="mb-4 p-2 {horror
			? 'silly-horror-panel text-red-400'
			: 'retro-panel bg-linear-to-r from-blue-600 to-purple-600 text-yellow-300'}"
	>
		<div
			class="overflow-hidden"
			aria-label={horror
				? 'Emergency broadcast channel 04. Do not look away. Remain indoors.'
				: 'Welcome to my awesome homepage'}
		>
			<span class="retro-marquee block text-2xl font-bold whitespace-nowrap">
				{horror
					? '*** EMERGENCY BROADCAST CH-04 — DO NOT LOOK AWAY — REMAIN INDOORS — SIGNAL DEGRADED ***'
					: '*** WELCOME TO MY AWESOME HOMEPAGE ***'}
			</span>
		</div>
	</div>

	<!-- Visitor counter -->
	<div class="mb-4 p-2 text-center {horror ? 'silly-horror-panel' : 'retro-panel bg-white'}">
		<span
			class="mr-2 inline-block h-4 w-4 animate-pulse motion-reduce:animate-none {horror
				? 'bg-red-700'
				: 'bg-red-500'}"
		></span>
		<span class="font-bold {horror ? 'text-red-400' : 'text-red-600'}">
			{horror ? 'REMAINING WITNESSES:' : 'TOTALLY REAL VISITOR NUMBER:'}
		</span>
		<span
			class="mx-2 bg-black px-3 py-1 font-mono text-xl {horror ? 'text-red-500' : 'text-lime-400'}"
		>
			{horror ? '000,001' : visitorCount.toLocaleString()}
		</span>
		<span
			class="ml-2 inline-block h-4 w-4 animate-pulse motion-reduce:animate-none {horror
				? 'bg-red-700'
				: 'bg-red-500'}"
		></span>
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
