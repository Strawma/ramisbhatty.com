<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	let clicks = 0;
	let visitorCount = Math.floor(Math.random() * 999999);
	let currentTime = new Date().toLocaleString();

	let currentFact = "";
	let isLoading = false;

	function handleChaosButton() {
		clicks++;
	}

	async function fetchRandomFact(): Promise<string> {
		try {
			const response = await fetch('https://uselessfacts.jsph.pl/api/v2/facts/random');
			const data = await response.json();
			return data.text;
		} catch (error) {
			console.error('Failed to fetch fact:', error);
			return "Failed to load fact from the internet (ironic, right?)";
		}
	}

	async function nextFact() {
		isLoading = true;
		currentFact = await fetchRandomFact();
		isLoading = false;
	}

	onMount(() => {
		const interval = setInterval(() => {
			visitorCount = Math.floor(Math.random() * 999999);
			currentTime = new Date().toLocaleString();
		}, 3000);
		nextFact();
		return () => clearInterval(interval);
	});
</script>

<div class="min-h-screen font-['pixel-sans',_cursive]" style="background: linear-gradient(45deg, #ff00ff 0%, #00ff00 25%, #ff0000 50%, #00ffff 75%, #ffff00 100%);">
	<!-- Main container with that classic table look -->
	<div class="max-w-5xl min-h-screen mx-auto bg-[#c0c0c0] px-8 flex flex-col">

	<!-- Marquee header -->
		<div class="bg-gradient-to-r from-blue-600 to-purple-600 text-yellow-300 p-2 mb-4 border-4 border-black">
			<marquee class="text-2xl font-bold">*** WELCOME TO MY AWESOME HOMEPAGE ***</marquee>
		</div>

		<!-- Visitor counter -->
		<div class="bg-white border-4 border-[#808080] p-2 mb-4 text-center" style="box-shadow: 4px 4px 0 #000;">
			<img src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" alt="" class="inline-block w-4 h-4 bg-red-500 animate-pulse mr-2" />
			<span class="font-bold text-red-600">YOU ARE VISITOR NUMBER:</span>
			<span class="bg-black text-lime-400 px-3 py-1 font-mono text-xl mx-2">{visitorCount.toLocaleString()}</span>
			<img src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" alt="" class="inline-block w-4 h-4 bg-red-500 animate-pulse ml-2" />
		</div>

		<!-- Main content table -->
		<div class="grid grid-cols-1 md:grid-cols-4 gap-4">

			<!-- Sidebar -->
			<div class="md:col-span-1">
				<div class="bg-[#ffff00] border-4 border-black p-4 mb-4" style="box-shadow: 4px 4px 0 #000;">
					<h2 class="text-xl font-bold mb-3 text-center underline">: : MENU : :</h2>
					<ul class="space-y-2">
						<li><a href="#" class="text-blue-600 underline hover:text-red-600">> Home</a></li>
						<!--						<li><a href="#" class="text-blue-600 underline hover:text-red-600">> About Me</a></li>-->
						<!--						<li><a href="#" class="text-blue-600 underline hover:text-red-600">> Portfolio</a></li>-->
						<!--						<li><a href="#" class="text-blue-600 underline hover:text-red-600">> Contact</a></li>-->
						<!--						<li><a href="#" class="text-blue-600 underline hover:text-red-600">> Cool Links</a></li>-->
					</ul>
				</div>

				<!-- Blinking button -->
				<div class="bg-gradient-to-b from-[#ff0000] to-[#8b0000] border-4 border-black p-4 text-center mb-4" style="box-shadow: 4px 4px 0 #000;">
					<button
						on:click={handleChaosButton}
						class="animate-pulse text-white font-bold text-lg bg-red-600 border-2 border-yellow-300 px-4 py-2 hover:bg-red-700">
						CLICK ME!
					</button>
					{#if clicks > 0}
						<p class="text-yellow-300 mt-2 text-sm" in:fade>Clicks: {clicks}</p>
					{/if}
				</div>

				<!-- Current time -->
				<div class="bg-black text-lime-400 border-4 border-[#00ff00] p-3 font-mono text-sm text-center">
					{currentTime}
				</div>
			</div>

			<!-- Main content area -->
			<div class="md:col-span-3 space-y-4">

				<!-- Welcome section -->
				<div class="bg-white border-4 border-black p-6" style="box-shadow: 4px 4px 0 #000;">
					<h1 class="text-4xl font-bold text-center mb-4" style="text-shadow: 2px 2px 0 #ff00ff, 4px 4px 0 #00ffff;">
						WELCOME TO MY WEBSITE!!!
					</h1>
					<hr class="border-2 border-black my-4" />
					<p class="text-lg mb-4">
						<blink class="text-red-600 font-bold">NEW!</blink> This site is best viewed in <strong>Netscape Navigator 4.0</strong> at 800x600 resolution!
					</p>
					<p class="mb-4">
						You are now entering the <strong><u>ULTIMATE</u></strong> personal homepage experience.
					</p>
				</div>

				<!-- Facts section -->
				<div class="bg-[#00ffff] border-4 border-black p-6" style="box-shadow: 4px 4px 0 #000;">
					<h2 class="text-2xl font-bold mb-4 text-center underline">&lt; RANDOM FACT GENERATOR &gt;</h2>
					<div class="bg-white border-2 border-black p-4 mb-4">
						{#if isLoading}
							<p class="text-lg italic animate-pulse">Loading fact from the World Wide Web...</p>
						{:else}
							<p class="text-lg italic">"{currentFact}"</p>
						{/if}
					</div>
					<button
						on:click={nextFact}
						class="bg-gradient-to-b from-[#c0c0c0] to-[#808080] border-4 border-black px-6 py-2 font-bold hover:from-[#e0e0e0]"
						style="box-shadow: 2px 2px 0 #000;">
						GENERATE NEW FACT →
					</button>
				</div>

				<!-- Under construction banner -->
				<div class="bg-yellow-400 border-4 border-black p-4 text-center" style="box-shadow: 4px 4px 0 #000;">
					<p class="text-2xl font-bold animate-pulse">!!! SITE UNDER CONSTRUCTION !!!</p>
				</div>

			</div>
		</div>

		<!-- Footer -->
		<div class="mt-6 bg-[#000080] text-white border-4 border-black p-4 text-center" style="box-shadow: 4px 4px 0 #000;">
			<p class="mb-2">This page is optimized for Internet Explorer 6</p>
			<div class="flex justify-center gap-4 items-center flex-wrap">
				<span class="bg-blue-500 px-3 py-1 border-2 border-white text-xs">HTML 4.01</span>
				<span class="bg-green-600 px-3 py-1 border-2 border-white text-xs">CSS ENABLED</span>
				<span class="bg-red-600 px-3 py-1 border-2 border-white text-xs">JAVASCRIPT</span>
				<span class="bg-purple-600 px-3 py-1 border-2 border-white text-xs">MIDI MUSIC</span>
			</div>
		</div>
	</div>
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
