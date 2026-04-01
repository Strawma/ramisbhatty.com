<!-- src/lib/components/prose/Nav.svelte -->
<script lang="ts">
	import { contact, nav } from '$lib/data/config';
	import { page } from '$app/state';

	const links = [
		{ href: nav.home, label: 'Home' },
		{ href: contact.github, label: 'Github' }
	];
</script>

<nav class="max-w-2xl mx-auto w-full px-6 py-6 flex items-center justify-between">
	<a href="{nav.home}" class="font-bold text-lg hover:text-neutral-600 transition-colors">
		{contact.name}
	</a>
	<div class="flex gap-6 text-sm">
		{#each links as link(link.href)}
			<a
				href={link.href}
				class="hover:text-neutral-600 transition-colors"
				class:font-semibold={page.url.pathname === link.href}
			>
				{link.label}
			</a>
		{/each}
	</div>
</nav>