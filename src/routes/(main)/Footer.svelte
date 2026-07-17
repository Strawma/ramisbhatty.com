<!-- src/lib/components/prose/Footer.svelte -->
<script lang="ts">
	import { contact } from '$lib/data/config';
	import { resolve } from '$app/paths';
</script>

<footer class="mx-auto w-full max-w-2xl px-6 py-8 text-sm text-neutral-400">
	<div class="flex items-center justify-between border-t border-neutral-200 pt-6">
		<p>© {new Date().getFullYear()} {contact.name}</p>
		<a href={resolve('/silly')} class="transition-colors hover:text-neutral-600"> :) </a>
	</div>
</footer>
