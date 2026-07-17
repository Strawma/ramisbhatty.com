<script lang="ts">
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

	<div class="mt-4 border-2 border-black bg-black p-2 font-mono text-xs text-lime-300">
		<p>USER: {member.name}</p>
		<p>ROLE: {member.role.toUpperCase()}</p>
		<p class="mt-2 text-green-400">STATUS: ONLINE</p>
	</div>

	<form method="POST" action="/bookclub/logout" class="mt-3">
		<button
			type="submit"
			class="w-full border-2 border-black bg-[#d4d0c8] px-2 py-1 text-sm font-bold shadow-[2px_2px_0_#000] hover:bg-white focus:ring-2 focus:ring-[#000080] focus:outline-none active:translate-x-[1px] active:translate-y-[1px]"
		>
			LOG OUT
		</button>
	</form>
</aside>
