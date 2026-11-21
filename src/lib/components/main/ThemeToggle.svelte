<script lang="ts">
	import { mainTheme } from '#lib/theme.svelte.ts';
</script>

<button
	type="button"
	role="switch"
	aria-checked={mainTheme.isDark}
	aria-label="Dark mode"
	onclick={() => mainTheme.toggle()}
	class="group -mx-1 inline-flex cursor-pointer items-center gap-2 px-1 py-1 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2"
>
	<span
		class="hidden font-mono text-xs tracking-wide text-neutral-500 uppercase transition-colors group-hover:text-neutral-700 motion-reduce:transition-none sm:inline dark:text-neutral-400 dark:group-hover:text-neutral-200"
	>
		Dark
	</span>
	<span
		class="relative h-5 w-10 border border-neutral-400 bg-neutral-200 transition-colors group-hover:bg-neutral-300 motion-reduce:transition-none dark:border-neutral-600 dark:bg-neutral-800 dark:group-hover:bg-neutral-700"
		aria-hidden="true"
	>
		<span
			class="absolute top-px left-px block size-4 bg-white shadow-sm transition-transform motion-reduce:transition-none dark:translate-x-5 dark:bg-neutral-300"
		></span>
	</span>
</button>
