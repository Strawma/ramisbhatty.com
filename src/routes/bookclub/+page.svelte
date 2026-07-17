<script lang="ts">
	import ClubNav from './ClubNav.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>The Book Club | Ramis Bhatty</title>
	<meta name="description" content="A private book club for friends." />
</svelte:head>

<main class="min-h-screen bg-[#008080] p-2 font-mono text-sm text-black sm:p-4">
	<div class="mx-auto max-w-7xl border-4 border-black bg-[#d4d0c8] shadow-[6px_6px_0_#000]">
		<header
			class="flex flex-wrap items-center justify-between gap-2 border-b-4 border-black bg-[#000080] px-3 py-2 font-bold text-white"
		>
			<h1>RAMIS BOOK CLUB ONLINE</h1>
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
						<p class="mt-3 max-w-3xl leading-6">
							The clubhouse is online. The shelves are still being arranged, but the extremely
							serious reading operations can begin here.
						</p>
						<div class="mt-4 grid gap-2 sm:grid-cols-3">
							<div class="border-2 border-black bg-white p-3">
								<p class="text-xs font-bold text-[#000080]">CURRENT MISSION</p>
								<p class="mt-2 font-bold">No book selected yet.</p>
							</div>
							<div class="border-2 border-black bg-white p-3">
								<p class="text-xs font-bold text-[#000080]">CLUB MORALE</p>
								<p class="mt-2 font-bold text-green-700">PROMISING</p>
							</div>
							<div class="border-2 border-black bg-white p-3">
								<p class="text-xs font-bold text-[#000080]">SYSTEM MESSAGE</p>
								<p class="mt-2 font-bold">Please insert literature.</p>
							</div>
						</div>
					</div>
				</section>

				<section
					id="current-book"
					class="mt-5 border-4 border-black bg-[#d4d0c8] shadow-[4px_4px_0_#000]"
				>
					<div class="border-b-2 border-black bg-[#000080] px-3 py-2 font-bold text-white">
						CURRENT BOOK // NOT CONFIGURED
					</div>
					<div class="grid gap-4 p-4 sm:grid-cols-[140px_1fr] sm:p-5">
						<div
							class="flex min-h-44 items-center justify-center border-2 border-black bg-white p-3 text-center text-xs"
						>
							COVER IMAGE
							<br />COMING SOON
						</div>
						<div>
							<p class="text-xs font-bold text-[#000080] uppercase">Reading session: not opened</p>
							<h2 class="mt-2 text-2xl font-black">The next book is classified.</h2>
							<p class="mt-3 leading-6">
								Once an admin selects a book, this panel will show the author, dates, reading
								status, and links to the club's reviews.
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
							SUGGESTION BOX // 0 OF 3 USED
						</div>
						<div class="space-y-2 p-4">
							<p class="leading-6">
								Submit three literary gambling tickets when the next selection cycle opens.
							</p>
							{#each [1, 2, 3] as slot (slot)}
								<div
									class="flex items-center justify-between border-2 border-black bg-white px-3 py-2"
								>
									<span class="font-bold">SLOT {slot}</span>
									<span class="text-xs text-gray-600">EMPTY</span>
								</div>
							{/each}
							<button
								type="button"
								disabled
								class="mt-2 border-2 border-black bg-[#808080] px-3 py-2 font-bold text-white opacity-60"
							>
								ADD SUGGESTION (SOON)
							</button>
						</div>
					</section>

					<section id="chatroom" class="border-4 border-black bg-[#d4d0c8] shadow-[4px_4px_0_#000]">
						<div class="border-b-2 border-black bg-[#008080] px-3 py-2 font-bold text-white">
							RAMIS BOOK CLUB IRC // OFFLINE
						</div>
						<div class="flex min-h-56 flex-col p-3">
							<div
								class="flex-1 border-2 border-black bg-black p-3 font-mono text-xs text-green-400"
							>
								<p>&gt; connecting to reading-zone...</p>
								<p>&gt; chatroom module not installed</p>
								<p>&gt; no messages loaded</p>
							</div>
							<div class="mt-3 flex gap-2">
								<input
									disabled
									aria-label="Chat message"
									placeholder="type a message..."
									class="min-w-0 flex-1 border-2 border-black bg-white px-2 py-2 text-xs"
								/>
								<button
									type="button"
									disabled
									class="border-2 border-black bg-[#808080] px-3 py-2 font-bold text-white opacity-60"
								>
									SEND
								</button>
							</div>
						</div>
					</section>
				</div>

				<div class="mt-5 grid gap-5 lg:grid-cols-2">
					<section id="archive" class="border-4 border-black bg-[#d4d0c8] shadow-[4px_4px_0_#000]">
						<div class="border-b-2 border-black bg-[#808080] px-3 py-2 font-bold text-white">
							ARCHIVE // EMPTY SHELVES
						</div>
						<div class="p-4">
							<p class="leading-6">
								Past books and reviews will appear here after the first reading cycle.
							</p>
						</div>
					</section>

					<section id="admin" class="border-4 border-black bg-[#d4d0c8] shadow-[4px_4px_0_#000]">
						<div class="border-b-2 border-black bg-[#800000] px-3 py-2 font-bold text-white">
							ADMIN CONSOLE // {data.member.role === 'admin' ? 'AVAILABLE' : 'RESTRICTED'}
						</div>
						<div class="p-4">
							<p class="leading-6">
								{data.member.role === 'admin'
									? 'Cycle controls, member management, and the draw console will appear here.'
									: 'This panel is reserved for the club administrator.'}
							</p>
						</div>
					</section>
				</div>
			</div>
		</div>

		<footer class="border-t-4 border-black bg-[#808080] px-3 py-2 text-xs text-white">
			RAMIS BOOK CLUB ONLINE // ALL SYSTEMS NOMINALLY OPERATIONAL // LAST UPDATE: NOW-ish
		</footer>
	</div>
</main>
