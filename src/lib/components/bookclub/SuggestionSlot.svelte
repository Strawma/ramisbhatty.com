<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { untrack } from 'svelte';

	interface SuggestionValue {
		id: string;
		title: string;
		author: string;
	}

	let {
		slot,
		active,
		suggestion
	}: {
		slot: number;
		active: boolean;
		suggestion?: SuggestionValue;
	} = $props();

	let pending = $state(false);
	let displayedSuggestionId = $state(untrack(() => suggestion?.id));
	let title = $state(untrack(() => suggestion?.title ?? ''));
	let author = $state(untrack(() => suggestion?.author ?? ''));

	$effect(() => {
		if (suggestion?.id === displayedSuggestionId) return;

		displayedSuggestionId = suggestion?.id;
		title = suggestion?.title ?? '';
		author = suggestion?.author ?? '';
	});

	const enhanceForm: SubmitFunction = ({ cancel }) => {
		if (pending) {
			cancel();
			return;
		}

		pending = true;
		return async ({ update }) => {
			try {
				await update({ reset: false });
			} finally {
				pending = false;
			}
		};
	};
</script>

<form
	method="POST"
	action="?/saveSuggestion"
	use:enhance={enhanceForm}
	aria-busy={pending}
	class="border-2 border-black bg-white p-3"
>
	<input type="hidden" name="position" value={slot} />
	{#if suggestion}
		<input type="hidden" name="suggestionId" value={suggestion.id} />
	{/if}
	<div class="flex items-center justify-between gap-2">
		<span class="font-bold">SLOT {slot}</span>
		<span class="text-xs text-gray-600">{suggestion ? 'FILLED' : 'EMPTY'}</span>
	</div>
	<div class="mt-2 grid gap-2 sm:grid-cols-2">
		<input
			name="title"
			aria-label={`Book title for slot ${slot}`}
			bind:value={title}
			placeholder="Book title"
			required
			disabled={!active}
			maxlength="200"
			class="border-2 border-black px-2 py-2 text-xs focus:ring-2 focus:ring-[#000080] focus:outline-none"
		/>
		<input
			name="author"
			aria-label={`Author for slot ${slot}`}
			bind:value={author}
			placeholder="Author"
			required
			disabled={!active}
			maxlength="120"
			class="border-2 border-black px-2 py-2 text-xs focus:ring-2 focus:ring-[#000080] focus:outline-none"
		/>
	</div>
	<div class="mt-2 flex flex-wrap gap-2">
		<button
			type="submit"
			disabled={!active || pending}
			class="border-2 border-black bg-[#d4d0c8] px-2 py-1 text-xs font-bold shadow-[2px_2px_0_#000] hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
		>
			{pending ? 'WORKING...' : suggestion ? 'UPDATE' : 'SAVE'}
		</button>
		{#if suggestion}
			<button
				type="submit"
				formaction="?/deleteSuggestion"
				formnovalidate
				disabled={!active || pending}
				class="border-2 border-black bg-[#fff0f0] px-2 py-1 text-xs font-bold text-[#800000] shadow-[2px_2px_0_#000] hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
			>
				CLEAR SLOT
			</button>
		{/if}
	</div>
</form>
