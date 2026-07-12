<!-- src/lib/components/prose/Nav.svelte -->
<script lang="ts">
	import { contact, nav } from '$lib/data/config';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
</script>

<nav class="max-w-2xl mx-auto w-full px-6 py-6 flex items-center justify-between">
	<a href={resolve(nav.home)} class="font-bold text-lg hover:text-neutral-600 transition-colors">
		{contact.name}
	</a>
	<div class="flex gap-6 text-sm">
		<a
			href={resolve(nav.home)}
			class="hover:text-neutral-600 transition-colors"
			class:font-semibold={page.url.pathname === nav.home}
		>
			Home
		</a>
		<a href={contact.github} rel="external" class="hover:text-neutral-600 transition-colors"
			>Github</a
		>
	</div>
</nav>
