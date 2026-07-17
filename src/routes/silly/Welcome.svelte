<script lang="ts">
	let { class: className = '' } = $props();
</script>

<div class="retro-panel bg-white p-6 {className}">
	<h1
		class="mb-4 text-center text-4xl font-bold"
		style="text-shadow: 2px 2px 0 #ff00ff, 4px 4px 0 #00ffff;"
	>
		WELCOME TO MY WEBSITE!!!
	</h1>
	<hr class="my-4 border-2 border-black" />
	<p class="mb-4 text-lg">
		<span class="retro-blink font-bold text-red-600">NEW!</span>
		This site is best viewed in
		<strong>Netscape Navigator 4.0</strong> at 800x600 resolution!
	</p>
	<p class="mb-4">
		You are now entering the <strong><u>ULTIMATE</u></strong> personal homepage experience.
	</p>
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
