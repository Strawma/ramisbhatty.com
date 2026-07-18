<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import bookclubSystemMessages from '$lib/data/bookclub-system-messages.json';
	import BackgroundMusic from '$lib/components/bookclub/BackgroundMusic.svelte';
	import ChatRoom from './ChatRoom.svelte';
	import ClubNav from './ClubNav.svelte';

	let { data, form } = $props();
	let timezoneOffset = $state(0);
	let coverFailed = $state(false);
	let systemMessage = $state(bookclubSystemMessages[0] ?? 'Please insert literature.');

	onMount(() => {
		timezoneOffset = new Date().getTimezoneOffset();
		systemMessage =
			bookclubSystemMessages[Math.floor(Math.random() * bookclubSystemMessages.length)] ??
			systemMessage;
	});

	function suggestionAt(position: number) {
		return data.dashboard.mySuggestions.find((suggestion) => suggestion.position === position);
	}

	function formatMeetingDate(value: string): string {
		return new Date(value).toLocaleString([], {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	function meetingInputValue(value: string | null): string {
		if (!value) return '';
		const date = new Date(value);
		const offset = date.getTimezoneOffset() * 60000;
		return new Date(date.getTime() - offset).toISOString().slice(0, 16);
	}

	function getClubMorale(): { label: string; detail: string } {
		const submitted = data.dashboard.suggestionProgress.reduce(
			(total, progress) => total + progress.count,
			0
		);

		if (data.dashboard.activeCycle) {
			return {
				label: 'SUGGESTION FRENZY',
				detail: `${submitted} literary ticket${submitted === 1 ? '' : 's'} submitted.`
			};
		}

		if (data.dashboard.drawReadyCycle) {
			return { label: 'DRAW FEVER', detail: 'The book machine is warmed up.' };
		}

		if (data.dashboard.currentBook && data.dashboard.nextMeeting) {
			return { label: 'FULLY BOOKED', detail: 'A book and a social appointment. Excellent.' };
		}

		if (data.dashboard.currentBook) {
			return { label: 'READING QUIETLY', detail: 'The current book is doing most of the work.' };
		}

		return { label: 'AWAITING LITERATURE', detail: 'Morale will improve when a book appears.' };
	}

	function formatBuildTimestamp(value: string): string {
		return new Date(value).toLocaleString([], {
			dateStyle: 'medium',
			timeStyle: 'short'
		});
	}
</script>

<svelte:head>
	<title>Bournemouth Mini Book Meet Thing (Working Title) | Ramis Bhatty</title>
	<meta name="description" content="A private reading group for friends." />
</svelte:head>

<main class="min-h-screen bg-[#008080] p-2 font-mono text-sm text-black sm:p-4">
	<div class="mx-auto max-w-7xl border-4 border-black bg-[#d4d0c8] shadow-[6px_6px_0_#000]">
		<header
			class="flex flex-wrap items-center justify-between gap-2 border-b-4 border-black bg-[#000080] px-3 py-2 font-bold text-white"
		>
			<h1>BMBMT // WORKING TITLE</h1>
			<p class="text-xs text-cyan-200">CONNECTION: SECURE / SESSION: ACTIVE</p>
		</header>

		<div class="md:flex">
			<ClubNav member={data.member} />

			<div class="min-w-0 flex-1 bg-[#008080] p-3 sm:p-5">
				<section id="clubhouse" class="border-4 border-black bg-[#d4d0c8] shadow-[4px_4px_0_#000]">
					<div class="border-b-2 border-black bg-[#808080] px-3 py-2 font-bold text-white">
						WELCOME TO THE READING ZONE
					</div>
					<div class="p-4 sm:p-5">
						<p class="text-xs font-bold text-[#000080] uppercase">Club bulletin</p>
						<h2 class="mt-2 text-2xl font-black sm:text-4xl">Hello, {data.member.name}.</h2>
						{#if form?.error || form?.success}
							<p
								class:text-green-700={form?.success}
								class="mt-3 border-2 border-black bg-white px-3 py-2 font-bold text-[#800000]"
								role={form?.error ? 'alert' : 'status'}
							>
								{form.error ?? form.success}
							</p>
						{/if}
						<p class="mt-3 max-w-3xl leading-6">
							Welcome to the Bournemouth Mini Book Meet Thing (Working Title). The shelves are still
							being arranged, but the extremely serious reading operations can begin here.
						</p>
						<div class="mt-4 grid gap-2 sm:grid-cols-3">
							<div class="border-2 border-black bg-white p-3">
								<p class="text-xs font-bold text-[#000080]">CURRENT MISSION</p>
								<p class="mt-2 font-bold">
									{data.dashboard.currentBook?.title ?? 'No book selected yet.'}
								</p>
							</div>
							<div class="border-2 border-black bg-white p-3">
								<p class="text-xs font-bold text-[#000080]">CLUB MORALE</p>
								<p class="mt-2 font-bold text-green-700">{getClubMorale().label}</p>
								<p class="mt-1 text-xs">{getClubMorale().detail}</p>
							</div>
							<div class="border-2 border-black bg-white p-3">
								<p class="text-xs font-bold text-[#000080]">SYSTEM MESSAGE</p>
								<p class="mt-2 font-bold">{systemMessage}</p>
							</div>
						</div>
						<div class="mt-4 border-2 border-black bg-[#ffffcc] p-3">
							<p class="text-xs font-bold text-[#800000]">NEXT MEETING</p>
							{#if data.dashboard.nextMeeting}
								<p class="mt-2 font-bold">
									{formatMeetingDate(data.dashboard.nextMeeting.scheduledFor)}
								</p>
								{#if data.dashboard.nextMeeting.note}
									<p class="mt-1 text-xs">{data.dashboard.nextMeeting.note}</p>
								{/if}
							{:else}
								<p class="mt-2 font-bold">No meeting scheduled.</p>
							{/if}
						</div>
						<BackgroundMusic />
					</div>
				</section>

				<section
					id="current-book"
					class="mt-5 border-4 border-black bg-[#d4d0c8] shadow-[4px_4px_0_#000]"
				>
					<div class="border-b-2 border-black bg-[#000080] px-3 py-2 font-bold text-white">
						CURRENT BOOK // {data.dashboard.currentBook ? 'ACTIVE' : 'NOT CONFIGURED'}
					</div>
					<div class="grid gap-4 p-4 sm:grid-cols-[140px_1fr] sm:p-5">
						{#if data.dashboard.currentBook?.coverUrl && !coverFailed}
							<div class="border-2 border-black bg-white p-2">
								<img
									src={data.dashboard.currentBook.coverUrl}
									alt={`Cover of ${data.dashboard.currentBook.title}`}
									class="mx-auto max-h-64 w-full object-contain"
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
								class="flex min-h-44 items-center justify-center border-2 border-black bg-white p-3 text-center text-xs"
							>
								COVER IMAGE
								<br />NOT FOUND
							</div>
						{/if}
						<div>
							<p class="text-xs font-bold text-[#000080] uppercase">
								Reading session: {data.dashboard.currentCycle?.label ?? 'not opened'}
							</p>
							<h2 class="mt-2 text-2xl font-black">
								{data.dashboard.currentBook?.title ?? 'The next book is classified.'}
							</h2>
							<p class="mt-3 leading-6">
								{#if data.dashboard.currentBook}
									By {data.dashboard.currentBook.author}. More stuff will appear here when I can be
									bothered to implement it.
								{:else}
									Once an admin runs the draw, this panel will show the winning book and author.
								{/if}
							</p>
						</div>
					</div>
				</section>

				<div class="mt-5 grid gap-5 lg:grid-cols-2">
					<section
						id="suggestions"
						class="border-4 border-black bg-[#d4d0c8] shadow-[4px_4px_0_#000]"
					>
						<div class="border-b-2 border-black bg-[#800080] px-3 py-2 font-bold text-white">
							SUGGESTION BOX // {data.dashboard.mySuggestions.length} OF {data.dashboard.activeCycle
								?.suggestionLimit ?? 3} USED
						</div>
						<div class="space-y-2 p-4">
							<p class="leading-6">
								{data.dashboard.activeCycle
									? 'Submit three literary gambling tickets before the session closes.'
									: 'No suggestion session is open. Await further literary instructions.'}
							</p>
							{#each [1, 2, 3] as slot (slot)}
								{@const suggestion = suggestionAt(slot)}
								<form
									method="POST"
									action="?/saveSuggestion"
									use:enhance
									class="border-2 border-black bg-white p-3"
								>
									<input type="hidden" name="position" value={slot} />
									{#if suggestion}
										<input type="hidden" name="suggestionId" value={suggestion.id} />
									{/if}
									<div class="flex items-center justify-between gap-2">
										<span class="font-bold">SLOT {slot}</span>
										<span class="text-xs text-gray-600">{suggestion ? 'FILLED' : 'EMPTY'}</span>
									</div>
									<div class="mt-2 grid gap-2 sm:grid-cols-2">
										<input
											name="title"
											value={suggestion?.title ?? ''}
											placeholder="Book title"
											required
											disabled={!data.dashboard.activeCycle}
											maxlength="200"
											class="border-2 border-black px-2 py-2 text-xs focus:ring-2 focus:ring-[#000080] focus:outline-none"
										/>
										<input
											name="author"
											value={suggestion?.author ?? ''}
											placeholder="Author"
											required
											disabled={!data.dashboard.activeCycle}
											maxlength="120"
											class="border-2 border-black px-2 py-2 text-xs focus:ring-2 focus:ring-[#000080] focus:outline-none"
										/>
									</div>
									<div class="mt-2 flex flex-wrap gap-2">
										<button
											type="submit"
											disabled={!data.dashboard.activeCycle}
											class="border-2 border-black bg-[#d4d0c8] px-2 py-1 text-xs font-bold shadow-[2px_2px_0_#000] hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
										>
											{suggestion ? 'UPDATE' : 'SAVE'}
										</button>
										{#if suggestion}
											<button
												type="submit"
												formaction="?/deleteSuggestion"
												class="border-2 border-black bg-[#fff0f0] px-2 py-1 text-xs font-bold text-[#800000] shadow-[2px_2px_0_#000] hover:bg-white"
											>
												DELETE
											</button>
										{/if}
									</div>
								</form>
							{/each}
							{#if data.dashboard.activeCycle}
								<div class="mt-4 border-2 border-black bg-black p-3 text-xs text-lime-300">
									<p class="font-bold text-white">MEMBER PROGRESS</p>
									{#each data.dashboard.suggestionProgress as progress (progress.memberId)}
										<p class="mt-1">{progress.memberName}: {progress.count}/3 tickets</p>
									{/each}
								</div>
							{/if}
						</div>
					</section>

					<ChatRoom messages={data.dashboard.chatMessages} isAdmin={data.member.role === 'admin'} />
				</div>

				<div class="mt-5 grid gap-5 lg:grid-cols-2">
					<section id="archive" class="border-4 border-black bg-[#d4d0c8] shadow-[4px_4px_0_#000]">
						<div class="border-b-2 border-black bg-[#808080] px-3 py-2 font-bold text-white">
							ARCHIVE // EMPTY SHELVES
						</div>
						<div class="p-4">
							<p class="leading-6">
								Past books and reviews will appear here after the first reading session.
							</p>
						</div>
					</section>

					{#if data.member.role === 'admin'}
						<section id="admin" class="border-4 border-black bg-[#d4d0c8] shadow-[4px_4px_0_#000]">
							<div class="border-b-2 border-black bg-[#800000] px-3 py-2 font-bold text-white">
								ADMIN CONSOLE // AVAILABLE
							</div>
							<div class="space-y-4 p-4">
								{#if data.dashboard.activeCycle}
									<div class="border-2 border-black bg-white p-3">
										<p class="font-bold">OPEN SESSION: {data.dashboard.activeCycle.label}</p>
										<p class="mt-1 text-xs">
											{data.dashboard.suggestionProgress.reduce(
												(total, item) => total + item.count,
												0
											)} tickets submitted.
										</p>
										<form method="POST" action="?/closeCycle" use:enhance class="mt-3">
											<button
												type="submit"
												class="border-2 border-black bg-[#d4d0c8] px-3 py-2 font-bold shadow-[2px_2px_0_#000] hover:bg-white"
											>
												CLOSE SUGGESTIONS
											</button>
										</form>
									</div>
								{:else if data.dashboard.drawReadyCycle}
									<div class="border-2 border-black bg-white p-3">
										<p class="font-bold">DRAW READY: {data.dashboard.drawReadyCycle.label}</p>
										<p class="mt-1 text-xs">
											{data.dashboard.suggestionProgress.reduce(
												(total, item) => total + item.count,
												0
											)} tickets submitted. The suggestion pool is locked. This draw cannot be rerun.
										</p>
										<form method="POST" action="?/draw" use:enhance class="mt-3">
											<button
												type="submit"
												class="border-2 border-black bg-[#d4d0c8] px-3 py-2 font-bold shadow-[2px_2px_0_#000] hover:bg-white"
											>
												SPIN THE BOOK MACHINE
											</button>
										</form>
									</div>
								{:else}
									<div class="border-2 border-black bg-white p-3">
										<p class="font-bold">OPEN A NEW SESSION</p>
										<form method="POST" action="?/createCycle" use:enhance class="mt-3 flex gap-2">
											<input
												name="label"
												placeholder="e.g. Session 01"
												required
												maxlength="80"
												class="min-w-0 flex-1 border-2 border-black px-2 py-2 text-xs focus:ring-2 focus:ring-[#000080] focus:outline-none"
											/>
											<button
												type="submit"
												class="border-2 border-black bg-[#d4d0c8] px-3 py-2 font-bold shadow-[2px_2px_0_#000] hover:bg-white"
											>
												OPEN
											</button>
										</form>
									</div>
								{/if}
								<div class="border-2 border-black bg-[#ffffcc] p-3">
									<p class="font-bold">NEXT MEETING</p>
									{#if data.dashboard.nextMeeting}
										<p class="mt-1 text-xs">
											Currently scheduled for {formatMeetingDate(
												data.dashboard.nextMeeting.scheduledFor
											)}.
										</p>
									{/if}
									<form method="POST" action="?/scheduleMeeting" use:enhance class="mt-3 space-y-2">
										<label class="block text-xs font-bold" for="scheduled-for">DATE AND TIME</label>
										<input
											id="scheduled-for"
											name="scheduledFor"
											type="datetime-local"
											required
											value={meetingInputValue(data.dashboard.nextMeeting?.scheduledFor ?? null)}
											class="w-full border-2 border-black px-2 py-2 text-xs focus:ring-2 focus:ring-[#000080] focus:outline-none"
										/>
										<input type="hidden" name="timezoneOffset" value={timezoneOffset} />
										<label class="block text-xs font-bold" for="meeting-note">NOTE (OPTIONAL)</label
										>
										<input
											id="meeting-note"
											name="note"
											maxlength="160"
											value={data.dashboard.nextMeeting?.note ?? ''}
											placeholder="e.g. bring snacks"
											class="w-full border-2 border-black px-2 py-2 text-xs focus:ring-2 focus:ring-[#000080] focus:outline-none"
										/>
										<div class="flex flex-wrap gap-2">
											<button
												type="submit"
												class="border-2 border-black bg-[#d4d0c8] px-3 py-2 font-bold shadow-[2px_2px_0_#000] hover:bg-white"
											>
												SCHEDULE
											</button>
											{#if data.dashboard.nextMeeting}
												<button
													type="submit"
													formaction="?/clearMeeting"
													formnovalidate
													class="border-2 border-black bg-[#fff0f0] px-3 py-2 font-bold text-[#800000] shadow-[2px_2px_0_#000] hover:bg-white"
												>
													CLEAR
												</button>
											{/if}
										</div>
									</form>
								</div>
							</div>
						</section>
					{/if}
				</div>
			</div>
		</div>

		<footer class="border-t-4 border-black bg-[#808080] px-3 py-2 text-xs text-white">
			BMBMT // ALL SYSTEMS NOMINALLY OPERATIONAL // LAST BUILD: {formatBuildTimestamp(
				data.buildTimestamp
			)} LOCAL
		</footer>
	</div>
</main>
