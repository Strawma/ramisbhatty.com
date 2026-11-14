<script lang="ts">
	import { onMount } from 'svelte';

	let isDark = $state(false);

	onMount(() => {
		isDark = document.documentElement.classList.contains('dark');
	});

	function toggleTheme(): void {
		isDark = !isDark;
		document.documentElement.classList.toggle('dark', isDark);
		document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';

		try {
			localStorage.setItem('theme', isDark ? 'dark' : 'light');
		} catch {
			// The theme still changes for this page view if storage is unavailable.
		}
	}
</script>

<button
	type="button"
	role="switch"
	aria-checked={isDark}
	aria-label="Dark mode"
	onclick={toggleTheme}
	class="group -mx-1 inline-flex cursor-pointer items-center gap-2 px-1 py-1 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2"
>
	<span
		class="hidden font-mono text-xs tracking-wide text-neutral-500 uppercase transition-colors group-hover:text-neutral-700 sm:inline dark:text-neutral-400 dark:group-hover:text-neutral-200"
	>
		Dark
	</span>
	<span
		class="relative h-5 w-10 border border-neutral-400 bg-neutral-200 transition-colors group-hover:bg-neutral-300 dark:border-neutral-600 dark:bg-neutral-800 dark:group-hover:bg-neutral-700"
		aria-hidden="true"
	>
		<span
			class="absolute top-0.5 left-0.5 block size-4 bg-white shadow-sm transition-transform dark:translate-x-5 dark:bg-neutral-300"
		></span>
	</span>
</button>
