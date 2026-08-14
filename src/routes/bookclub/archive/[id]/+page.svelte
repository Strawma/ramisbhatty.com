<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import ClubNav from '../../ClubNav.svelte';

	let { data, form } = $props();
	let coverFailed = $state(false);
	let reviewFormReady = $state(false);
	let ratedReviews = $derived(data.reviews.filter((review) => review.rating !== null));
	let averageRating = $derived(
		ratedReviews.length === 0
			? null
			: ratedReviews.reduce((total, review) => total + (review.rating ?? 0), 0) /
					ratedReviews.length
	);

	function formatDate(value: string): string {
		return new Date(value).toLocaleString([], {
			dateStyle: 'medium',
			timeStyle: 'short'
		});
	}

	function confirmReviewDelete(event: MouseEvent): void {
		if (!window.confirm('Delete your review and notes for this book?')) event.preventDefault();
	}

	onMount(() => {
		// Initial review values are hydrated from server data. Holding the controls briefly prevents
		// hydration from replacing input entered before the client has attached to the form.
		reviewFormReady = true;
	});
</script>

<svelte:head>
	<title>{data.entry.book.title} // BMBMT Archive | Ramis Bhatty</title>
	<meta name="description" content={`Archived book-club record: ${data.entry.book.title}.`} />
</svelte:head>

<main class="min-h-screen p-2 font-mono text-sm text-black sm:p-4">
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
					href={resolve('bookclub#archive')}
					class="inline-block border-2 border-black bg-[#d4d0c8] px-2 py-1 font-bold underline shadow-[2px_2px_0_#000] hover:bg-white focus:ring-2 focus:ring-[#000080] focus:outline-none"
				>
					&lt; BACK TO ARCHIVE
				</a>
				<a
					href={resolve(`bookclub/draw/${data.entry.id}`)}
					class="ml-2 inline-block border-2 border-black bg-[#ffffcc] px-2 py-1 font-bold underline shadow-[2px_2px_0_#000] hover:bg-white focus:ring-2 focus:ring-[#000080] focus:outline-none"
				>
					REPLAY DRAW &gt;
				</a>

				<section class="mt-4 border-4 border-black bg-[#d4d0c8] shadow-[4px_4px_0_#000]">
					<div class="border-b-2 border-black bg-[#808080] px-3 py-2 font-bold text-white">
						{data.entry.book.title} // ARCHIVED BOOK
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
								<p><strong>POLL OPENED:</strong> {formatDate(data.entry.openedAt)}</p>
								{#if data.entry.book.startedAt}
									<p><strong>BOOK STARTED:</strong> {formatDate(data.entry.book.startedAt)}</p>
								{/if}
								{#if data.entry.book.completedAt}
									<p><strong>BOOK COMPLETED:</strong> {formatDate(data.entry.book.completedAt)}</p>
								{/if}
							</div>
						</div>
					</div>
				</section>

				<section class="mt-5 border-4 border-black bg-[#d4d0c8] shadow-[4px_4px_0_#000]">
					<div class="border-b-2 border-black bg-[#800080] px-3 py-2 font-bold text-white">
						REVIEWS + NOTES // {data.reviews.length} SAVED
					</div>
					<div class="p-4 sm:p-5">
						<div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.75fr)]">
							<div>
								<div class="border-2 border-black bg-white p-3">
									<p class="text-xs font-bold text-[#800080]">CLUB SCORE</p>
									<p class="mt-1 text-2xl font-black">
										{averageRating === null ? 'NOT YET RATED' : `${averageRating.toFixed(1)} / 5`}
									</p>
									<p class="mt-1 text-xs">
										{ratedReviews.length} rating{ratedReviews.length === 1 ? '' : 's'} / {data
											.reviews.length} review{data.reviews.length === 1 ? '' : 's'}
									</p>
								</div>

								<div class="mt-3 space-y-3">
									{#each data.reviews as review (review.id)}
										<article class="border-2 border-black bg-white p-3">
											<div class="flex flex-wrap items-center justify-between gap-2">
												<p class="font-bold">
													<span
														class="mr-2 inline-block size-3 border border-black align-middle"
														style:background-color={review.memberChatColor}
													></span>
													{review.memberName}
												</p>
												<p class="font-bold text-[#000080]">
													{review.rating === null ? 'UNRATED' : `${review.rating} / 5`}
												</p>
											</div>

											{#snippet reviewContent()}
												{#if review.verdict}<p class="mt-3 font-black">{review.verdict}</p>{/if}
												{#if review.body}<p class="mt-2 leading-6 whitespace-pre-wrap">
														{review.body}
													</p>{/if}
												{#if review.favouriteQuote}
													<blockquote
														class="mt-3 border-l-4 border-[#800080] bg-[#ffffcc] p-2 italic"
													>
														“{review.favouriteQuote}”
													</blockquote>
												{/if}
											{/snippet}

											{#if review.spoiler}
												<details
													class="mt-3 border-2 border-dashed border-[#800000] bg-[#fff0f0] p-2"
												>
													<summary class="cursor-pointer font-bold text-[#800000]"
														>SHOW SPOILERS</summary
													>
													{@render reviewContent()}
												</details>
											{:else}
												{@render reviewContent()}
											{/if}
											<p class="mt-3 text-[10px] text-gray-600">
												Updated {formatDate(review.updatedAt)}
											</p>
										</article>
									{:else}
										<p class="border-2 border-dashed border-black bg-[#ffffcc] p-3 text-xs">
											No reviews yet. The review desk is accepting dispatches.
										</p>
									{/each}
								</div>
							</div>

							<form
								method="POST"
								action="?/saveReview"
								use:enhance
								class="border-2 border-black bg-[#ffffcc] p-3"
							>
								<fieldset disabled={!reviewFormReady} class="m-0 min-w-0 border-0 p-0">
									<p class="font-bold text-[#800000]">YOUR REVIEW TERMINAL</p>
									<p class="mt-1 text-xs">Save again to update your existing review.</p>

									<label for="rating" class="mt-3 block font-bold">RATING</label>
									<select
										id="rating"
										name="rating"
										value={data.myReview?.rating ?? ''}
										class="mt-1 w-full border-2 border-black bg-white px-2 py-2"
									>
										<option value="">Unrated</option>
										{#each [1, 2, 3, 4, 5] as rating (rating)}
											<option value={rating}>{rating} / 5</option>
										{/each}
									</select>

									<label for="verdict" class="mt-3 block font-bold">SHORT VERDICT</label>
									<input
										id="verdict"
										name="verdict"
										maxlength="120"
										value={data.myReview?.verdict ?? ''}
										class="mt-1 w-full border-2 border-black bg-white px-2 py-2"
									/>

									<label for="review-body" class="mt-3 block font-bold">REVIEW / NOTES</label>
									<textarea
										id="review-body"
										name="body"
										maxlength="4000"
										rows="8"
										value={data.myReview?.body ?? ''}
										class="mt-1 w-full border-2 border-black bg-white px-2 py-2"></textarea>

									<label for="favourite-quote" class="mt-3 block font-bold">FAVOURITE QUOTE</label>
									<textarea
										id="favourite-quote"
										name="favouriteQuote"
										maxlength="1000"
										rows="3"
										value={data.myReview?.favouriteQuote ?? ''}
										class="mt-1 w-full border-2 border-black bg-white px-2 py-2"></textarea>

									<label class="mt-3 flex items-start gap-2 font-bold">
										<input
											type="checkbox"
											name="spoiler"
											checked={data.myReview?.spoiler ?? false}
											class="mt-1"
										/>
										<span>THIS REVIEW CONTAINS SPOILERS</span>
									</label>

									{#if form?.error || form?.success}
										<p
											class:text-green-700={form?.success}
											class="mt-3 border-2 border-black bg-white p-2 font-bold text-[#800000]"
											role={form?.error ? 'alert' : 'status'}
										>
											{form.error ?? form.success}
										</p>
									{/if}

									<div class="mt-3 flex flex-wrap gap-2">
										<button
											type="submit"
											class="border-2 border-black bg-[#d4d0c8] px-3 py-2 font-bold shadow-[2px_2px_0_#000] hover:bg-white"
										>
											{data.myReview ? 'UPDATE REVIEW' : 'SAVE REVIEW'}
										</button>
										{#if data.myReview}
											<button
												type="submit"
												formaction="?/deleteReview"
												formnovalidate
												onclick={confirmReviewDelete}
												class="border-2 border-black bg-[#fff0f0] px-3 py-2 font-bold text-[#800000] shadow-[2px_2px_0_#000] hover:bg-white"
											>
												DELETE MY REVIEW
											</button>
										{/if}
									</div>
								</fieldset>
							</form>
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
