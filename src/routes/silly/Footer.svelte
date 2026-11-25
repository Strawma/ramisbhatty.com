<script lang="ts">
	let { horror = false }: { horror?: boolean } = $props();

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
	<div
		class="p-4 text-center {horror
			? 'silly-horror-panel text-red-400'
			: 'retro-panel bg-yellow-400'}"
	>
		<p class="animate-pulse text-2xl font-bold motion-reduce:animate-none">
			{horror ? '!!! DO NOT TURN OFF YOUR MONITOR !!!' : '!!! SITE UNDER CONSTRUCTION !!!'}
		</p>
	</div>

	<!-- Browser badges -->
	<div
		class="p-4 text-center text-white {horror ? 'silly-horror-panel' : 'retro-panel bg-[#000080]'}"
	>
		<p class="mb-2 {horror ? 'text-zinc-300' : ''}">
			{horror
				? 'Broadcast Archive · Tape 04 · Signal integrity degraded'
				: 'This page is optimized for Internet Explorer 6'}
		</p>
		<div class="flex flex-wrap items-center justify-center gap-4">
			{#each badges as badge (badge.label)}
				<a
					href={badge.href}
					rel="external"
					class="{horror
						? 'border-2 border-red-900 bg-zinc-900 text-zinc-200 hover:border-red-500'
						: `${badge.color} border-2 border-white`} px-3 py-1 text-xs"
				>
					{badge.label}
				</a>
			{/each}
		</div>
	</div>
</footer>
