<!-- src/lib/components/prose/Nav.svelte -->
<script lang="ts">
	import { contact, nav } from '$lib/data/config';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	const links = [
		{ label: 'Work', href: nav.work },
		{ label: 'Education', href: nav.education },
		{ label: 'Blog', href: nav.blog },
		{ label: 'About', href: nav.about }
	];
</script>

<nav
	class="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-4 px-6 py-6"
	aria-label="Main navigation"
>
	<a href={resolve(nav.home)} class="text-lg font-bold transition-colors hover:text-neutral-600">
		{contact.name}
	</a>
	<div class="flex flex-wrap gap-x-5 gap-y-2 text-sm">
		<a
			href={resolve(nav.home)}
			class="transition-colors hover:text-neutral-600"
			class:font-semibold={page.url.pathname === nav.home}
		>
			Home
		</a>
		{#each links as link (link.href)}
			<a
				href={resolve(link.href)}
				class="transition-colors hover:text-neutral-600"
				class:font-semibold={page.url.pathname === link.href ||
					page.url.pathname.startsWith(`${link.href}/`)}
			>
				{link.label}
			</a>
		{/each}
	</div>
</nav>
