<script lang="ts">
	let {
		mark,
		compact = false,
		label = 'Overall mark'
	}: { mark: number; compact?: boolean; label?: string } = $props();

	function markColour(value: number): string {
		if (value >= 70)
			return 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-200';
		if (value >= 60)
			return 'border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-700 dark:bg-sky-950 dark:text-sky-200';
		if (value >= 50)
			return 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200';
		return 'border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-700 dark:bg-rose-950 dark:text-rose-200';
	}
</script>

<span
	class={`inline-flex items-baseline gap-2 border px-2 py-1 text-xs ${markColour(mark)}`}
	aria-label={`${label}: ${mark}%`}
>
	{#if !compact}<span class="font-medium">{label}</span>{/if}
	<strong class="font-mono">{mark}%</strong>
</span>
