<script lang="ts">
	import { resolve } from '$app/paths';
	import ClubNav from '../../ClubNav.svelte';

	let { data } = $props();
	let coverFailed = $state(false);

	function formatDate(value: string): string {
		return new Date(value).toLocaleString([], {
			dateStyle: 'medium',
			timeStyle: 'short'
		});
	}
</script>

<svelte:head>
	<title>{data.entry.book.title} // BMBMT Archive | Ramis Bhatty</title>
	<meta name="description" content={`Archived book-club session: ${data.entry.book.title}.`} />
</svelte:head>

<main class="min-h-screen bg-[#008080] p-2 font-mono text-sm text-black sm:p-4">
	<div class="mx-auto max-w-7xl border-4 border-black bg-[#d4d0c8] shadow-[6px_6px_0_#000]">
		<header
			class="flex flex-wrap items-center justify-between gap-2 border-b-4 border-black bg-[#000080] px-3 py-2 font-bold text-white"
		>
			<h1>BMBMT // ARCHIVE TERMINAL</h1>
			<p class="text-xs text-cyan-200">STATUS: HISTORICAL RECORD</p>
		</header>

		<div class="md:flex">
			<ClubNav member={data.member} />

			<div class="min-w-0 flex-1 bg-[#008080] p-3 sm:p-5">
				<a
					href={resolve('/bookclub#archive')}
					class="inline-block border-2 border-black bg-[#d4d0c8] px-2 py-1 font-bold underline shadow-[2px_2px_0_#000] hover:bg-white focus:ring-2 focus:ring-[#000080] focus:outline-none"
				>
					&lt; BACK TO ARCHIVE
				</a>

				<section class="mt-4 border-4 border-black bg-[#d4d0c8] shadow-[4px_4px_0_#000]">
					<div class="border-b-2 border-black bg-[#808080] px-3 py-2 font-bold text-white">
						{data.entry.label} // ARCHIVED SESSION
					</div>
					<div class="grid gap-5 p-4 sm:grid-cols-[160px_1fr] sm:p-5">
						{#if data.entry.book.coverUrl && !coverFailed}
							<div class="border-2 border-black bg-white p-2">
								<img
									src={data.entry.book.coverUrl}
									alt={`Cover of ${data.entry.book.title}`}
									class="mx-auto max-h-72 w-full object-contain"
									onerror={() => (coverFailed = true)}
								/>
								<p class="mt-2 text-center text-[10px] text-gray-600">
									Cover via <a
										href="https://openlibrary.org"
										target="_blank"
										rel="noreferrer"
										class="underline">Open Library</a
									>.
								</p>
							</div>
						{:else}
							<div
								class="flex min-h-52 items-center justify-center border-2 border-black bg-white p-3 text-center text-xs"
							>
								COVER IMAGE<br />NOT FOUND
							</div>
						{/if}

						<div>
							<p class="text-xs font-bold text-[#000080] uppercase">Book record</p>
							<h2 class="mt-2 text-3xl font-black sm:text-5xl">{data.entry.book.title}</h2>
							<p class="mt-3 text-lg">By {data.entry.book.author}</p>
							<div class="mt-5 border-2 border-black bg-white p-3 text-xs leading-5">
								<p><strong>SESSION:</strong> {data.entry.label}</p>
								<p><strong>RECORDED:</strong> {formatDate(data.entry.createdAt)}</p>
								{#if data.entry.book.startedAt}
									<p><strong>STARTED:</strong> {formatDate(data.entry.book.startedAt)}</p>
								{/if}
							</div>
						</div>
					</div>
				</section>

				<section class="mt-5 border-4 border-black bg-[#d4d0c8] shadow-[4px_4px_0_#000]">
					<div class="border-b-2 border-black bg-[#800080] px-3 py-2 font-bold text-white">
						REVIEWS + NOTES // {data.entry.reviewCount} SAVED
					</div>
					<div class="p-4 sm:p-5">
						<p class="leading-6">
							This is the permanent record for this reading session. Member reviews, favourite
							quotes, and other notes will live here when the review desk is switched on.
						</p>
						<div class="mt-4 border-2 border-dashed border-black bg-[#ffffcc] p-4 text-xs">
							<p class="font-bold text-[#800000]">REVIEW DESK // NOT YET OPEN</p>
							<p class="mt-2">
								No review form is available yet. The archive record is ready for it.
							</p>
						</div>
					</div>
				</section>
			</div>
		</div>

		<footer class="border-t-4 border-black bg-[#808080] px-3 py-2 text-xs text-white">
			BMBMT // ARCHIVE RECORD // KEEP READING
		</footer>
	</div>
</main>
