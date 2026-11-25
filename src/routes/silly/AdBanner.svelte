<!-- AdBanner.svelte -->
<script lang="ts">
	import AoOniSrc from '#lib/assets/images/ao oni.gif';
	import { contact } from '#lib/data/config.ts';
	let {
		class: className = '',
		size = 'large',
		horror = false
	}: {
		class?: string;
		size?: string;
		horror?: boolean;
	} = $props();
</script>

<div
	class="p-4 text-center {horror
		? 'silly-horror-panel'
		: 'border-4 border-black bg-white'} {className}"
	style={horror ? undefined : 'box-shadow: 4px 4px 0 #000;'}
>
	<p class="mb-2 text-sm {horror ? 'text-red-400' : ''}">
		{horror ? '-- SIGNAL INTRUSION --' : '-- AD SPACE --'}
	</p>
	<a
		href="https://cse103-notes.readthedocs.io/en/latest/pumpinglemma.html"
		aria-label="Read notes about the pumping lemma"
	>
		<img
			src={AoOniSrc}
			alt="Animated Ao Oni character"
			class="mx-auto {size === 'large'
				? 'h-16 w-200 object-fill'
				: 'h-48 w-64 object-contain'} {horror ? 'silly-vhs-media' : ''}"
		/>
	</a>
	<p class="mt-2 text-xs {horror ? 'text-zinc-300' : ''}">
		{horror ? 'IF YOU RECOGNIZE THIS FIGURE, CLOSE THIS WINDOW' : 'Your Ad Here!'}
	</p>
	<p class="mt-2 text-xs break-all">
		{#if horror}
			<span class="text-zinc-400">DO NOT REPLY TO </span>
		{/if}
		<a
			href="mailto:{contact.ad_email}"
			class="underline {horror
				? 'text-red-400 hover:text-zinc-100'
				: 'text-blue-600 hover:text-red-600'}"
		>
			{contact.ad_email}
		</a>
	</p>
</div>
