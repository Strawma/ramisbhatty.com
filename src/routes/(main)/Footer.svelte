<!-- src/lib/components/prose/Footer.svelte -->
<script lang="ts">
	import { contact } from '$lib/data/config'
</script>

<footer class="max-w-2xl mx-auto w-full px-6 py-8 text-sm text-neutral-400">
	<div class="flex justify-between items-center border-t border-neutral-200 pt-6">
		<p>© {new Date().getFullYear()} {contact.name}</p>
		<a href="/silly" class="hover:text-neutral-600 transition-colors">
			:)
		</a>
	</div>
</footer>