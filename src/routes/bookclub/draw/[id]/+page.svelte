<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import DrawWheel from '#lib/components/bookclub/DrawWheel.svelte';
	import ClubNav from '../../ClubNav.svelte';

	let { data, form } = $props();
	let returnHref = $derived(
		data.replay.book.completedAt
			? resolve(`bookclub/archive/${data.replay.cycleId}`)
			: data.replay.book.startedAt
				? resolve('bookclub#current-book')
				: resolve('bookclub#upcoming-book')
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
						{#if !data.replay.book.startedAt}
							<p class="mb-4 border-2 border-black bg-[#ffffcc] p-3 font-bold">
								UPCOMING BOOK: {data.replay.book.title} by {data.replay.book.author}. Pick up a copy
								before an admin starts it.
							</p>
						{/if}
						{#if form?.error}
							<p role="alert" class="mb-4 border-2 border-black bg-[#ffcccc] p-3">{form.error}</p>
						{/if}
						{#key data.replay.drawId}
							<DrawWheel
								drawId={data.replay.drawId}
								suggestions={data.replay.suggestions}
								winnerSuggestionId={data.replay.winnerSuggestionId}
							/>
						{/key}
						{#if data.member.role === 'admin' && !data.replay.book.startedAt}
							<details class="mt-5 border-2 border-black bg-[#ffffcc] p-3">
								<summary class="cursor-pointer font-bold">ADMIN: REROLL UPCOMING BOOK</summary>
								<p class="mt-2">
									Use only when the selection cannot go ahead. The rejected book stays out of this
									poll, and the reason is visible to all members.
								</p>
								<form method="POST" action="?/reroll" use:enhance class="mt-3 space-y-2">
									<input type="hidden" name="drawId" value={data.replay.drawId} />
									<label for="reroll-reason" class="block font-bold">Reason for reroll</label>
									<textarea
										id="reroll-reason"
										name="reason"
										required
										maxlength="300"
										rows="2"
										class="w-full border-2 border-black bg-white p-2"></textarea>
									<button
										type="submit"
										class="border-2 border-black bg-[#d4d0c8] px-3 py-2 font-bold shadow-[2px_2px_0_#000]"
										>RESPIN BOOK</button
									>
								</form>
							</details>
						{/if}
						{#if data.replay.rerolls.length}
							<section aria-label="Reroll history" class="mt-5 border-2 border-black bg-white p-3">
								<h2 class="font-bold">REROLL HISTORY</h2>
								{#each data.replay.rerolls as reroll (reroll.id)}
									<p class="mt-2">
										{reroll.memberName} rejected {reroll.previousTitle} by {reroll.previousAuthor}: {reroll.reason}
									</p>
								{/each}
							</section>
						{/if}
					</div>
				</section>
			</div>
		</div>

		<footer class="border-t-4 border-black bg-[#808080] px-3 py-2 text-xs text-white">
			THE SERVER-SAVED RESULT IS AUTHORITATIVE // REPLAYING DOES NOT REDRAW
		</footer>
	</div>
</main>
