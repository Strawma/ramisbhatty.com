<!-- src/lib/components/prose/Nav.svelte -->
<script lang="ts">
	import { contact, nav } from '$lib/data/config';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
</script>

<nav class="mx-auto flex w-full max-w-2xl items-center justify-between px-6 py-6">
	<a href={resolve(nav.home)} class="text-lg font-bold transition-colors hover:text-neutral-600">
		{contact.name}
	</a>
	<div class="flex gap-6 text-sm">
		<a
			href={resolve(nav.home)}
			class="transition-colors hover:text-neutral-600"
			class:font-semibold={page.url.pathname === nav.home}
		>
			Home
		</a>
		<a href={contact.github} rel="external" class="transition-colors hover:text-neutral-600"
			>Github</a
		>
	</div>
</nav>
