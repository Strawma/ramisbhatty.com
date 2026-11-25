<script lang="ts">
	let { class: className = '', horror = false }: { class?: string; horror?: boolean } = $props();
</script>

<div class="{horror ? 'silly-horror-panel' : 'retro-panel bg-white'} p-6 {className}">
	<h1
		class="mb-4 text-center text-4xl font-bold {horror ? 'silly-phosphor-text text-zinc-100' : ''}"
		style={horror ? undefined : 'text-shadow: 2px 2px 0 #ff00ff, 4px 4px 0 #00ffff;'}
	>
		{horror ? 'THIS BROADCAST HAS ENDED' : 'WELCOME TO MY WEBSITE!!!'}
	</h1>
	<hr class="my-4 border-2 {horror ? 'border-red-900' : 'border-black'}" />
	{#if horror}
		<p class="mb-4 text-lg">
			<span class="retro-blink font-bold text-red-500">ALERT!</span>
			This transmission was decommissioned in
			<strong>October 1998</strong>. Do not adjust your horizontal hold.
		</p>
		<p class="mb-4 text-zinc-300">
			Signal origin could not be verified. Remain indoors until the tone stops.
		</p>
	{:else}
		<p class="mb-4 text-lg">
			<span class="retro-blink font-bold text-red-600">NEW!</span>
			This site is best viewed in
			<strong>Netscape Navigator 4.0</strong> at 800x600 resolution!
		</p>
		<p class="mb-4">
			You are now entering the <strong><u>ULTIMATE</u></strong> personal homepage experience.
		</p>
	{/if}
</div>

<style>
	.retro-blink {
		animation: blink 1s infinite;
	}

	@keyframes blink {
		0%,
		49% {
			opacity: 1;
		}
		50%,
		100% {
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.retro-blink {
			animation: none;
		}
	}
</style>
