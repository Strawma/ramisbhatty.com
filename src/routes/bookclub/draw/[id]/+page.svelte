<script lang="ts">
	import { resolve } from '$app/paths';
	import DrawWheel from '#lib/components/bookclub/DrawWheel.svelte';
	import ClubNav from '../../ClubNav.svelte';

	let { data } = $props();
	let returnHref = $derived(
		data.replay.book.completedAt
			? resolve(`bookclub/archive/${data.replay.cycleId}`)
			: resolve('bookclub#current-book')
	);
</script>

<svelte:head>
	<title>{data.replay.book.title} // BMBMT Draw Replay | Ramis Bhatty</title>
	<meta
		name="description"
		content={`Replay the saved book-club draw for ${data.replay.book.title}.`}
	/>
</svelte:head>

<main class="min-h-screen p-2 font-mono text-sm text-black sm:p-4">
	<div class="mx-auto max-w-7xl border-4 border-black bg-[#d4d0c8] shadow-[6px_6px_0_#000]">
		<header
			class="flex flex-wrap items-center justify-between gap-2 border-b-4 border-black bg-[#000080] px-3 py-2 font-bold text-white"
		>
			<h1>BMBMT // DRAW MACHINE</h1>
			<p class="text-xs text-cyan-200">RESULT: SAVED / REPLAY: DETERMINISTIC</p>
		</header>

		<div class="md:flex">
			<ClubNav member={data.member} />
			<div class="min-w-0 flex-1 bg-[#008080] p-3 sm:p-5">
				<a
					href={returnHref}
					class="inline-block border-2 border-black bg-[#d4d0c8] px-2 py-1 font-bold underline shadow-[2px_2px_0_#000] hover:bg-white focus:ring-2 focus:ring-[#000080] focus:outline-none"
				>
					&lt; RETURN TO BOOK
				</a>

				<section class="mt-4 border-4 border-black bg-[#d4d0c8] shadow-[4px_4px_0_#000]">
					<div class="border-b-2 border-black bg-[#800080] px-3 py-2 font-bold text-white">
						SPIN NEXT BOOK // {data.replay.suggestions.length} TICKET{data.replay.suggestions
							.length === 1
							? ''
							: 'S'}
					</div>
					<div class="p-4 sm:p-5">
						<DrawWheel
							drawId={data.replay.drawId}
							suggestions={data.replay.suggestions}
							winnerSuggestionId={data.replay.winnerSuggestionId}
						/>
					</div>
				</section>
			</div>
		</div>

		<footer class="border-t-4 border-black bg-[#808080] px-3 py-2 text-xs text-white">
			THE SERVER-SAVED RESULT IS AUTHORITATIVE // REPLAYING DOES NOT REDRAW
		</footer>
	</div>
</main>
