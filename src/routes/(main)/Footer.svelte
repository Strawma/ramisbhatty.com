<!-- src/lib/components/prose/Footer.svelte -->
<script lang="ts">
	import { contact } from '$lib/data/config';
	import { resolve } from '$app/paths';
</script>

<footer class="mx-auto w-full max-w-3xl px-6 py-8 text-sm text-neutral-500">
	<div class="flex items-center justify-between border-t border-neutral-200 pt-6">
		<p>© {new Date().getFullYear()} {contact.name}</p>
		<div class="flex gap-4">
			<a href="mailto:{contact.email}" class="underline underline-offset-4">Email</a>
			<a href={contact.github} rel="external" class="underline underline-offset-4">GitHub</a>
			<a
				href={resolve('/silly')}
				class="transition-colors hover:text-neutral-700"
				aria-label="Visit the silly version of this site">:)</a
			>
		</div>
	</div>
</footer>
