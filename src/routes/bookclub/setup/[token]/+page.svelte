<script lang="ts">
	let { data, form } = $props();
	let isReset = $derived(data.invitation?.purpose === 'reset');
</script>

<svelte:head>
	<title>{isReset ? 'Reset Book Club Login' : 'Join The Book Club'} | Ramis Bhatty</title>
	<meta name="description" content="Private book club account setup." />
	<meta name="referrer" content="no-referrer" />
</svelte:head>

<main
	class="flex min-h-screen items-center justify-center bg-[#008080] p-3 font-mono text-sm text-black sm:p-6"
>
	<section class="w-full max-w-lg border-4 border-black bg-[#d4d0c8] shadow-[6px_6px_0_#000]">
		<header
			class="flex items-center justify-between gap-3 border-b-4 border-black bg-[#000080] px-3 py-2 font-bold text-white"
		>
			<h1>RAMIS BOOK CLUB ONLINE</h1>
			<span class="text-xs text-cyan-200">SETUP.EXE</span>
		</header>

		<div class="p-4 sm:p-6">
			{#if data.invitation}
				<div class="border-2 border-black bg-white p-3">
					<p class="font-bold text-[#000080]">
						{isReset
							? 'LOGIN CODE RESET // PRIVATE TERMINAL'
							: 'NEW MEMBER SETUP // PRIVATE TERMINAL'}
					</p>
					<h2 class="mt-2 text-3xl font-black">
						{isReset ? 'Choose a new code.' : `Welcome, ${data.invitation.memberName}.`}
					</h2>
					<p class="mt-2 font-bold text-[#800000]">USERNAME: {data.invitation.username}</p>
					<p class="mt-3 leading-6">
						{isReset
							? 'Choose a new private login code. Your old sessions will be signed out when this link is used.'
							: 'Choose a private login code for future visits. The administrator will never see it.'}
					</p>
				</div>

				<form method="POST" class="mt-5 space-y-4">
					<div>
						<label for="invite-code" class="block font-bold text-[#000080]">NEW LOGIN CODE</label>
						<input
							id="invite-code"
							name="inviteCode"
							type="password"
							autocomplete="new-password"
							minlength="12"
							maxlength="256"
							required
							class="mt-2 w-full border-2 border-black bg-white px-3 py-3 shadow-[2px_2px_0_#000] focus:ring-2 focus:ring-[#000080] focus:outline-none"
						/>
						<p class="mt-1 text-xs">Minimum 12 characters.</p>
					</div>
					<div>
						<label for="confirmation" class="block font-bold text-[#000080]"
							>REPEAT LOGIN CODE</label
						>
						<input
							id="confirmation"
							name="confirmation"
							type="password"
							autocomplete="new-password"
							minlength="12"
							maxlength="256"
							required
							class="mt-2 w-full border-2 border-black bg-white px-3 py-3 shadow-[2px_2px_0_#000] focus:ring-2 focus:ring-[#000080] focus:outline-none"
						/>
					</div>

					{#if form?.error}
						<p class="border-2 border-[#800000] bg-[#fff0f0] px-3 py-2 text-[#800000]" role="alert">
							ERROR: {form.error}
						</p>
					{/if}

					<button
						type="submit"
						class="w-full border-2 border-black bg-[#d4d0c8] px-4 py-3 font-black shadow-[3px_3px_0_#000] hover:bg-white focus:ring-2 focus:ring-[#000080] focus:outline-none active:translate-x-[1px] active:translate-y-[1px]"
					>
						&gt; {isReset ? 'SAVE NEW CODE' : 'JOIN THE CLUB'}
					</button>
				</form>
			{:else}
				<div class="border-2 border-black bg-[#fff0f0] p-4 text-[#800000]">
					<p class="font-bold">SETUP LINK UNAVAILABLE</p>
					<p class="mt-2 leading-6">
						This link has expired, been used, or been revoked. Ask the administrator for a new one.
					</p>
				</div>
			{/if}
		</div>

		<footer class="border-t-4 border-black bg-[#808080] px-3 py-2 text-xs text-white">
			PRIVATE SETUP // LINKS EXPIRE // DO NOT SHARE IN THE CLUB CHAT
		</footer>
	</section>
</main>
