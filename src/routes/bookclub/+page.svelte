<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>The Book Club | Ramis Bhatty</title>
	<meta name="description" content="A private book club for friends." />
</svelte:head>

<main class="min-h-screen bg-amber-50 px-6 py-8 text-stone-900 sm:px-10 sm:py-12">
	<header class="mx-auto flex max-w-5xl items-start justify-between gap-6">
		<div>
			<p class="text-sm font-bold uppercase tracking-[0.2em] text-amber-700">The clubhouse</p>
			<h1 class="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
				Welcome, {data.member.name}.
			</h1>
		</div>
		<form method="POST" action="/bookclub/logout">
			<button
				type="submit"
				class="rounded-xl border-2 border-stone-900 bg-white px-4 py-2 text-sm font-bold shadow-[3px_3px_0_#292524] transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-amber-500 active:translate-y-0"
			>
				Leave club
			</button>
		</form>
	</header>

	<section
		class="mx-auto mt-10 max-w-5xl rounded-3xl border-4 border-stone-900 bg-white p-6 shadow-[8px_8px_0_#292524] sm:p-10"
	>
		<p class="text-sm font-bold uppercase tracking-[0.2em] text-stone-500">Coming soon</p>
		<h2 class="mt-3 text-3xl font-black">The shelves are still being arranged.</h2>
		<p class="mt-4 max-w-2xl text-lg leading-8 text-stone-600">
			You are authenticated as a {data.member.role}. The next step is adding the current book,
			reading cycles, suggestions, and the highly scientific selection draw.
		</p>
	</section>
</main>
