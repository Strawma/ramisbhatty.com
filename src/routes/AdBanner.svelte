<!-- AdBanner.svelte -->
<script lang="ts">
	import AoOniSrc from '$lib/assets/images/ao oni.gif';
	let { class: className = '', size = 'large' } = $props();
</script>

<div
	class="bg-white border-4 border-black p-4 text-center {className}"
	style="box-shadow: 4px 4px 0 #000;"
>
	<p class="text-sm mb-2">-- AD SPACE --</p>
	<a href="https://cse103-notes.readthedocs.io/en/latest/pumpinglemma.html">
		<img
			src={AoOniSrc}
			alt="Ad"
			class="mx-auto {size === 'large' ? 'w-200 h-16 object-fill' : 'w-64 h-48 object-contain'}"
		/>
	</a>
	<p class="text-xs mt-2">Your Ad Here!</p>
	<p class="text-xs mt-2 break-all">
		<a href="mailto:advertising@ramisbhatty.com" class="text-blue-600 underline hover:text-red-600">
			advertising@ramisbhatty.com
		</a>
	</p>
</div>