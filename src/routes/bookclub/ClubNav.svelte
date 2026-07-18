<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';

	type Member = {
		name: string;
		role: 'member' | 'admin';
	};

	let { member }: { member: Member } = $props();

	const links = [
		{ label: 'Clubhouse', href: '/bookclub#clubhouse' },
		{ label: 'Current book', href: '/bookclub#current-book' },
		{ label: 'Suggestion box', href: '/bookclub#suggestions' },
		{ label: 'Chatroom', href: '/bookclub#chatroom' },
		{ label: 'Archive', href: '/bookclub#archive' }
	] as const;
</script>

<aside
	class="border-b-4 border-black bg-[#c0c0c0] p-3 md:w-56 md:shrink-0 md:border-r-4 md:border-b-0"
>
	<div class="border-2 border-black bg-[#000080] px-2 py-1 text-center font-bold text-white">
		CLUB MENU
	</div>

	<nav aria-label="Book club sections" class="mt-3">
		<ul class="grid grid-cols-2 gap-2 md:grid-cols-1">
			{#each links as link (link.label)}
				<li>
					<a
						href={resolve(link.href)}
						class="block border-2 border-black bg-[#d4d0c8] px-2 py-1 text-sm font-bold underline shadow-[2px_2px_0_#000] hover:bg-white focus:ring-2 focus:ring-[#000080] focus:outline-none active:translate-x-[1px] active:translate-y-[1px]"
					>
						&gt; {link.label}
					</a>
				</li>
			{/each}
		</ul>
	</nav>

	{#if member.role === 'admin'}
		<a
			href={resolve('/bookclub/admin')}
			class="mt-2 block border-2 border-black bg-[#fff0f0] px-2 py-1 text-sm font-bold text-[#800000] underline shadow-[2px_2px_0_#000] hover:bg-white focus:ring-2 focus:ring-[#000080] focus:outline-none"
		>
			&gt; Admin panel
		</a>
	{/if}

	<div class="mt-4 border-2 border-black bg-black p-2 font-mono text-xs text-lime-300">
		<p>USER: {member.name}</p>
		<p>ROLE: {member.role.toUpperCase()}</p>
		<p class="mt-2 text-green-400">STATUS: ONLINE</p>
	</div>

	<details class="mt-3 border-2 border-black bg-[#d4d0c8]">
		<summary
			class="cursor-pointer px-2 py-1 text-sm font-bold underline hover:bg-white focus:ring-2 focus:ring-[#000080] focus:outline-none"
		>
			EDIT DISPLAY NAME
		</summary>
		<form method="POST" action="/bookclub?/changeDisplayName" use:enhance class="space-y-2 p-2">
			<label for="sidebar-display-name" class="block text-xs font-bold text-[#000080]"
				>YOUR DISPLAY NAME</label
			>
			<input
				id="sidebar-display-name"
				name="displayName"
				maxlength="24"
				required
				value={member.name}
				class="w-full border-2 border-black bg-white px-2 py-2 text-xs focus:ring-2 focus:ring-[#000080] focus:outline-none"
			/>
			<p class="text-[10px] text-gray-600">1-24 characters. Changes are announced in chat.</p>
			<button
				type="submit"
				class="w-full border-2 border-black bg-[#d4d0c8] px-2 py-1 text-xs font-bold shadow-[2px_2px_0_#000] hover:bg-white focus:ring-2 focus:ring-[#000080] focus:outline-none"
			>
				SAVE NAME
			</button>
		</form>
	</details>

	<form method="POST" action="/bookclub/logout" class="mt-3">
		<button
			type="submit"
			class="w-full border-2 border-black bg-[#d4d0c8] px-2 py-1 text-sm font-bold shadow-[2px_2px_0_#000] hover:bg-white focus:ring-2 focus:ring-[#000080] focus:outline-none active:translate-x-[1px] active:translate-y-[1px]"
		>
			LOG OUT
		</button>
	</form>
</aside>
