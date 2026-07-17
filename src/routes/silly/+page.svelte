<script lang="ts">
	import RamisSrc from '$lib/assets/images/ramis-pixellated.webp';

	import BouncerManager from '$lib/components/bouncer/BouncerManager.svelte';
	import Bouncer from '$lib/components/bouncer/Bouncer.svelte';
	import Header from './Header.svelte';
	import Sidebar from './Sidebar.svelte';
	import AdBanner from './AdBanner.svelte';
	import Footer from './Footer.svelte';
	import FactGenerator from './FactGenerator.svelte';
	import Welcome from './Welcome.svelte';

	const midiFiles = import.meta.glob('$lib/assets/midi/*.mid', {
		eager: true,
		query: '?url',
		import: 'default'
	});

	const bouncerConfigs = Array.from({ length: 15 }, () => ({
		size: 0.02 + Math.random() * 0.08, // 2%–10% of viewport
		speed: Math.floor(Math.random() * 600) + 300
	}));
</script>

<BouncerManager fps={8}>
	{#each bouncerConfigs as config, i (i)}
		<Bouncer {...config} imageSrc={RamisSrc} />
	{/each}

	<div
		class="min-h-screen font-['pixel-sans',cursive]"
		style="background: linear-gradient(45deg, #ff00ff 0%, #00ff00 25%, #ff0000 50%, #00ffff 75%, #ffff00 100%);"
	>
		<div class="relative z-20 mx-auto flex min-h-screen max-w-3xl flex-col bg-[#c0c0c0] px-8">
			<Header />

			<div class="grid grid-cols-1 gap-4 md:grid-cols-4">
				<Sidebar {midiFiles} />
				<div class="space-y-4 md:col-span-3">
					<Welcome />
					<AdBanner />
				</div>
			</div>

			<hr class="my-4 border border-black" />

			<div class="grid grid-cols-1 gap-4 md:grid-cols-4">
				<AdBanner size="square" class="md:col-span-2" />
				<FactGenerator class="md:col-span-2" />
			</div>

			<Footer />
		</div>
	</div>
</BouncerManager>

<style>
	@font-face {
		font-family: 'pixel-sans';
		src: url('$lib/assets/fonts/pixel-comic-sans.ttf') format('truetype');
	}
</style>
