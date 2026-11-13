<script lang="ts">
	function toggleTheme(): void {
		const isDark = document.documentElement.classList.toggle('dark');
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
	class="cursor-pointer text-sm transition-colors hover:text-neutral-600 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 dark:hover:text-neutral-300"
	aria-label="Toggle light or dark theme"
	onclick={toggleTheme}
>
	<span class="dark:hidden">Dark</span>
	<span class="hidden dark:inline">Light</span>
</button>
