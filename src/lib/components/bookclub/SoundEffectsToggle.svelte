<script lang="ts">
	import { onMount } from 'svelte';
	import {
		getSoundEffectsSnapshot,
		initializeSoundEffects,
		subscribeToSoundEffects,
		toggleSoundEffects,
		type SoundEffectsSnapshot
	} from './sound-effects';

	let sound = $state<SoundEffectsSnapshot>(getSoundEffectsSnapshot());
	let changing = $state(false);

	onMount(() => {
		initializeSoundEffects();
		return subscribeToSoundEffects((nextSnapshot) => (sound = nextSnapshot));
	});

	async function toggle(): Promise<void> {
		changing = true;
		try {
			await toggleSoundEffects();
		} finally {
			changing = false;
		}
	}

	function soundLabel(): string {
		if (sound.unavailable) return 'FX: NO AUDIO';
		return sound.enabled ? 'FX: ON' : 'FX: OFF';
	}
</script>

<div class="mt-3 border-2 border-black bg-black p-2 text-xs text-lime-300">
	<div class="flex items-center justify-between gap-2">
		<span class="font-bold text-white">SOUND FX</span>
		<button
			type="button"
			onclick={toggle}
			disabled={changing}
			aria-pressed={sound.enabled}
			aria-label="Toggle sound effects"
			class="border-2 border-lime-300 px-2 py-1 font-bold text-lime-300 hover:bg-lime-300 hover:text-black focus:ring-2 focus:ring-white focus:outline-none disabled:opacity-50"
		>
			{soundLabel()}
		</button>
	</div>
	<p class="mt-2 text-lime-200/80">Chat tones, arrival dings, and draw-wheel audio.</p>
	{#if sound.unavailable}
		<p class="mt-2 text-yellow-300">Browser audio is unavailable.</p>
	{/if}
</div>
