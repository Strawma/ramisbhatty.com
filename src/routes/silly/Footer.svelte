<script lang="ts">
	const badges: { label: string; href: string; color: string }[] = [
		{
			label: 'HTML 4.01',
			href: 'https://www.w3.org/TR/2018/SPSD-html401-20180327/',
			color: 'bg-blue-500'
		},
		{
			label: 'CSS ENABLED',
			href: 'https://www.w3.org/TR/CSS2/',
			color: 'bg-green-600'
		},
		{
			label: 'JAVASCRIPT',
			href: 'https://ecma-international.org/publications-and-standards/standards/ecma-262/',
			color: 'bg-red-600'
		},
		{
			label: 'MIDI MUSIC',
			href: 'https://midi.org/specs',
			color: 'bg-purple-600'
		}
	];
</script>

<footer class="mt-4 space-y-4">
	<!-- Under construction -->
	<div class="bg-yellow-400 retro-panel p-4 text-center">
		<p class="text-2xl font-bold animate-pulse">!!! SITE UNDER CONSTRUCTION !!!</p>
	</div>

	<!-- Browser badges -->
	<div class="bg-[#000080] text-white retro-panel p-4 text-center">
		<p class="mb-2">This page is optimized for Internet Explorer 6</p>
		<div class="flex justify-center gap-4 items-center flex-wrap">
			{#each badges as badge (badge.label)}
				<a
					href={badge.href}
					rel="external"
					class="{badge.color} px-3 py-1 border-2 border-white text-xs"
				>
					{badge.label}
				</a>
			{/each}
		</div>
	</div>
</footer>
