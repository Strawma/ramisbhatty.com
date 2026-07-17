<!-- AdBanner.svelte -->
<script lang="ts">
	import AoOniSrc from '$lib/assets/images/ao oni.gif';
	import { contact } from '$lib/data/config';
	let { class: className = '', size = 'large' } = $props();
</script>

<div
	class="border-4 border-black bg-white p-4 text-center {className}"
	style="box-shadow: 4px 4px 0 #000;"
>
	<p class="mb-2 text-sm">-- AD SPACE --</p>
	<a href="https://cse103-notes.readthedocs.io/en/latest/pumpinglemma.html">
		<img
			src={AoOniSrc}
			alt="Ad"
			class="mx-auto {size === 'large' ? 'h-16 w-200 object-fill' : 'h-48 w-64 object-contain'}"
		/>
	</a>
	<p class="mt-2 text-xs">Your Ad Here!</p>
	<p class="mt-2 text-xs break-all">
		<a href="mailto:{contact.ad_email}" class="text-blue-600 underline hover:text-red-600">
			{contact.ad_email}
		</a>
	</p>
</div>
