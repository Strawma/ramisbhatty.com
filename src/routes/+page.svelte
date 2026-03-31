<script lang="ts">
	import RamisSrc from '$lib/assets/images/ramis-pixellated.webp';

	import BouncerManager from '$lib/components/bouncer/BouncerManager.svelte';
	import Bouncer from '$lib/components/bouncer/Bouncer.svelte';
	import Header from './Header.svelte';
	import Sidebar from './Sidebar.svelte';
	import AdBanner from './AdBanner.svelte';
	import Footer from './Footer.svelte';
	import FactGenerator from './FactGenerator.svelte';

	const midiFiles = import.meta.glob('$lib/assets/midi/*.mid', {
		eager: true,
		query: '?url',
		import: 'default',
	});

	const bouncerConfigs = Array.from({ length: 15 }, () => ({
		radius: Math.floor(Math.random() * 40) + 20,
		speed: Math.floor(Math.random() * 600) + 300,
	}));
</script>

<div
	class="min-h-screen font-['pixel-sans',cursive]"
	style="background: linear-gradient(45deg, #ff00ff 0%, #00ff00 25%, #ff0000 50%, #00ffff 75%, #ffff00 100%);"
>
	<BouncerManager width="100vw" height="100vh" fps={8}>
		{#each bouncerConfigs as config, i (i)}
			<Bouncer {...config} imageSrc={RamisSrc} />
		{/each}

		<div class="max-w-3xl min-h-screen mx-auto bg-[#c0c0c0] px-8 flex flex-col relative z-10">
			<Header />

			<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Sidebar {midiFiles} />

				<div class="md:col-span-3 space-y-4">
					<!-- Welcome -->
					<div class="bg-white retro-panel p-6">
						<h1
							class="text-4xl font-bold text-center mb-4"
							style="text-shadow: 2px 2px 0 #ff00ff, 4px 4px 0 #00ffff;"
						>
							WELCOME TO MY WEBSITE!!!
						</h1>
						<hr class="border-2 border-black my-4" />
						<p class="text-lg mb-4">
							<blink class="text-red-600 font-bold">NEW!</blink>
							This site is best viewed in
							<strong>Netscape Navigator 4.0</strong> at 800x600 resolution!
						</p>
						<p class="mb-4">
							You are now entering the <strong><u>ULTIMATE</u></strong> personal homepage experience.
						</p>
					</div>

					<AdBanner />
				</div>
			</div>

			<hr class="border border-black my-4" />

			<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
				<AdBanner size="square" class="md:col-span-2" />
				<FactGenerator class="md:col-span-2" />
			</div>

			<Footer />
		</div>
	</BouncerManager>
</div>

<style>
  blink {
    animation: blink 1s infinite;
  }
  @keyframes blink {
    0%, 49% { opacity: 1; }
    50%, 100% { opacity: 0; }
  }
  @font-face {
    font-family: 'pixel-sans';
    src: url('$lib/assets/fonts/pixel-comic-sans.ttf') format('truetype');
  }
</style>