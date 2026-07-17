<script lang="ts">
	let { form, data } = $props();
</script>

<svelte:head>
	<title>Book Club Login | Ramis Bhatty</title>
	<meta name="description" content="Private access to Ramis Bhatty's book club." />
	<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
</svelte:head>

<main
	class="flex min-h-screen items-center justify-center bg-[#008080] p-3 font-mono text-sm text-black sm:p-6"
>
	<section class="w-full max-w-lg border-4 border-black bg-[#d4d0c8] shadow-[6px_6px_0_#000]">
		<header
			class="flex items-center justify-between gap-3 border-b-4 border-black bg-[#000080] px-3 py-2 font-bold text-white"
		>
			<h1>RAMIS BOOK CLUB ONLINE</h1>
			<span class="text-xs text-cyan-200">LOGIN.EXE</span>
		</header>

		<div class="p-4 sm:p-6">
			<div class="border-2 border-black bg-white p-3">
				<p class="font-bold text-[#000080]">MEMBERS ONLY // ACCESS TERMINAL</p>
				<h2 class="mt-2 text-3xl font-black">Enter the clubhouse.</h2>
				<p class="mt-3 leading-6">
					Present your username and private login code to access the reading zone. There is no
					public sign-up, because the clubhouse has standards.
				</p>
			</div>

			<form method="POST" class="mt-5 space-y-5">
				<div>
					<label for="username" class="block font-bold text-[#000080]">USERNAME</label>
					<input
						id="username"
						name="username"
						type="text"
						autocomplete="username"
						maxlength="32"
						required
						class="mt-2 w-full border-2 border-black bg-white px-3 py-3 shadow-[2px_2px_0_#000] focus:ring-2 focus:ring-[#000080] focus:outline-none"
					/>
					<p class="mt-1 text-xs">Use the username assigned by the administrator.</p>
				</div>
				<div>
					<label for="invite-code" class="block font-bold text-[#000080]">LOGIN CODE</label>
					<input
						id="invite-code"
						name="inviteCode"
						type="password"
						autocomplete="current-password"
						minlength="12"
						required
						maxlength="256"
						class="mt-2 w-full border-2 border-black bg-white px-3 py-3 shadow-[2px_2px_0_#000] focus:ring-2 focus:ring-[#000080] focus:outline-none"
					/>
					<p class="mt-1 text-xs">Minimum 12 characters.</p>
				</div>

				{#if data.turnstileSiteKey}
					<div class="border-2 border-black bg-white p-2">
						<div
							class="cf-turnstile"
							data-sitekey={data.turnstileSiteKey}
							data-action="bookclub-login"
							data-theme="light"
						></div>
					</div>
				{:else}
					<p class="border-2 border-[#800000] bg-[#fff0f0] px-3 py-2 text-[#800000]" role="status">
						SYSTEM MESSAGE: Bot check is not configured yet.
					</p>
				{/if}

				{#if form?.error}
					<p class="border-2 border-[#800000] bg-[#fff0f0] px-3 py-2 text-[#800000]" role="alert">
						ERROR: {form.error}
					</p>
				{/if}

				<button
					type="submit"
					class="w-full border-2 border-black bg-[#d4d0c8] px-4 py-3 font-black shadow-[3px_3px_0_#000] hover:bg-white focus:ring-2 focus:ring-[#000080] focus:outline-none active:translate-x-[1px] active:translate-y-[1px]"
				>
					&gt; ENTER THE CLUB
				</button>
			</form>
		</div>

		<footer class="border-t-4 border-black bg-[#808080] px-3 py-2 text-xs text-white">
			STATUS: AWAITING CREDENTIALS // PLEASE DO NOT FEED THE BOOKS AFTER MIDNIGHT
		</footer>
	</section>
</main>
