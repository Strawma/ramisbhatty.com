<script lang="ts">
	let { class: className = '' } = $props();
</script>

<div class="bg-white retro-panel p-6 {className}">
	<h1
		class="text-4xl font-bold text-center mb-4"
		style="text-shadow: 2px 2px 0 #ff00ff, 4px 4px 0 #00ffff;"
	>
		WELCOME TO MY WEBSITE!!!
	</h1>
	<hr class="border-2 border-black my-4" />
	<p class="text-lg mb-4">
		<blink class="text-red-600 font-bold">NEW!</blink>
		This site is best viewed in
		<strong>Netscape Navigator 4.0</strong> at 800x600 resolution!
	</p>
	<p class="mb-4">
		You are now entering the <strong><u>ULTIMATE</u></strong> personal homepage experience.
	</p>
</div>