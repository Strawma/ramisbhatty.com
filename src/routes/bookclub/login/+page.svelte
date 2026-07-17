<script lang="ts">
	let { form, data } = $props();
</script>

<svelte:head>
	<title>Book Club Login | Ramis Bhatty</title>
	<meta name="description" content="Private access to Ramis Bhatty's book club." />
	<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
</svelte:head>

<main class="min-h-screen bg-amber-50 px-6 py-12 text-stone-900 sm:py-20">
	<section
		class="mx-auto max-w-md rounded-3xl border-4 border-stone-900 bg-white p-6 shadow-[8px_8px_0_#292524] sm:p-8"
	>
		<p class="mb-3 text-sm font-bold tracking-[0.2em] text-amber-700 uppercase">Members only</p>
		<h1 class="text-4xl font-black tracking-tight">The book club</h1>
		<p class="mt-4 text-stone-600">
			Enter your invite code to join the clubhouse. There is no public sign-up.
		</p>

		<form method="POST" class="mt-8 space-y-5">
			<div>
				<label for="invite-code" class="block text-sm font-bold">Invite code</label>
				<input
					id="invite-code"
					name="inviteCode"
					type="password"
					autocomplete="current-password"
					required
					maxlength="256"
					class="mt-2 w-full rounded-xl border-2 border-stone-900 px-4 py-3 shadow-[3px_3px_0_#292524] focus:ring-2 focus:ring-amber-500"
				/>
			</div>

			{#if data.turnstileSiteKey}
				<div
					class="cf-turnstile"
					data-sitekey={data.turnstileSiteKey}
					data-action="bookclub-login"
					data-theme="light"
				></div>
			{:else}
				<p
					class="rounded-xl border-2 border-amber-800 bg-amber-50 px-4 py-3 text-sm text-amber-950"
					role="status"
				>
					The bot check is not configured yet.
				</p>
			{/if}

			{#if form?.error}
				<p
					class="rounded-xl border-2 border-red-800 bg-red-50 px-4 py-3 text-sm text-red-900"
					role="alert"
				>
					{form.error}
				</p>
			{/if}

			<button
				type="submit"
				class="w-full rounded-xl border-2 border-stone-900 bg-amber-300 px-4 py-3 font-black shadow-[3px_3px_0_#292524] transition-transform hover:-translate-y-0.5 focus:ring-2 focus:ring-amber-500 focus:outline-none active:translate-y-0"
			>
				Enter the club
			</button>
		</form>
	</section>
</main>
