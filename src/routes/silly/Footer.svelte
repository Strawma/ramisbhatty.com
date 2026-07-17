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
	<div class="retro-panel bg-yellow-400 p-4 text-center">
		<p class="animate-pulse text-2xl font-bold">!!! SITE UNDER CONSTRUCTION !!!</p>
	</div>

	<!-- Browser badges -->
	<div class="retro-panel bg-[#000080] p-4 text-center text-white">
		<p class="mb-2">This page is optimized for Internet Explorer 6</p>
		<div class="flex flex-wrap items-center justify-center gap-4">
			{#each badges as badge (badge.label)}
				<a
					href={badge.href}
					rel="external"
					class="{badge.color} border-2 border-white px-3 py-1 text-xs"
				>
					{badge.label}
				</a>
			{/each}
		</div>
	</div>
</footer>
