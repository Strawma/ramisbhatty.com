<script lang="ts">
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import { linear } from 'svelte/easing';

	import brb_quotes from '$lib/data/quotes.json';
	import WindowsSRC from '$lib/assets/images/windows-xp.png';
	import WindowsBottomSRC from '$lib/assets/images/windows-xp-bottom.png';
	import JimSRC from '$lib/assets/images/jim.png';

	// Pool of quotes to display in the sliding bar
	const quotes = brb_quotes;
	const brbText = "Be Right Back!";
	const quoteTime = 8000; // Time in milliseconds to display each quote

	let quoteIndex = $state(0);
	let currentQuote = $derived(quotes[quoteIndex]);

	let quoteVisible = $state(false);
	let timeoutId;

	function randomiseQuote() {
		let newIndex = quoteIndex;
		while (newIndex === quoteIndex && quotes.length > 1) {
			newIndex = Math.floor(Math.random() * quotes.length);
		}
		quoteIndex = newIndex;
	}

	onMount(() => {
		quoteVisible = true;
		function scheduleNextToggle() {
			// Calculate delay based on current visibility state
			const delay = quoteVisible ? quoteTime : quoteTime / 5;

			timeoutId = setTimeout(() => {
				quoteVisible = !quoteVisible;

				// If we just hid the quote, randomize for next one
				if (!quoteVisible) {
					randomiseQuote();
				}

				// Schedule next toggle with appropriate timing
				scheduleNextToggle();
			}, delay);
		}
		scheduleNextToggle();

		return () => clearTimeout(timeoutId);
	});
</script>

<div class="w-full h-screen relative overflow-hidden">
	<!-- BRB Text -->
	<div class="absolute top-60/100 left-4/100 -translate-y-1/2 text-white font-bold z-30 brb-text-container">
		{#each brbText as char, i (i)}
			<span class="floating-letter" style="animation-delay: {i * 0.1}s;">
				{#if char === " "}
					&nbsp;
				{:else}
					{char}
				{/if}
			</span>
		{/each}
	</div>

	<!-- BRB Sliding -->
	<div class="absolute bottom-8/100 left-0 w-full h-[8%] bg-black bg-opacity-70 text-white flex items-center justify-center z-30 ticker-bar">
		{#if quoteVisible}
			<div
				class="absolute ticker-content"
				in:slide={{ duration: quoteTime/10, easing: linear }}
				out:slide={{ duration: quoteTime/10, easing: linear }}
			>
				{currentQuote}
			</div>
		{/if}
	</div>

	<!-- Background images -->
	<img src={WindowsSRC} alt="Windows XP" class="absolute w-full h-full object-cover z-0 hue-shift-bg" />
	<img
		src={JimSRC}
		alt="Jim"
		class="absolute h-[90%] min-h-[100px] top-1/2 left-3/4 -translate-y-1/2 -translate-x-1/2 object-contain z-10 rotating-image"
	/>
	<img src={WindowsBottomSRC} alt="Windows XP Bottom" class="absolute w-full h-full object-cover z-20 hue-shift-bottom" />
</div>

<style>
	@font-face {
		font-family: 'pixel-sans';
		src: url('$lib/assets/fonts/pixel-comic-sans.ttf') format('truetype');
  }

  @keyframes slow-rotation {
    from {
      transform: rotate(-30deg);
    }
    to {
      transform: rotate(30deg);
    }
  }

  .rotating-image {
    animation: slow-rotation 8s linear infinite alternate;
  }

	.brb-text-container {
	 white-space: nowrap;
	 max-width: 90vw;
	 font-family: 'pixel-sans', cursive, sans-serif;
	 text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
	 font-size: clamp(1rem, 10vw, 10rem);
	}

  .ticker-bar {
    background: linear-gradient(to bottom, #245eab, #0c407c);
    border-top: 2px solid #6bafea;
    box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.3);
  }

  .ticker-content {
    font-family: 'pixel-sans', sans-serif;
    color: white;
    font-size: clamp(0.5rem, 2vw, 2rem);
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
    white-space: nowrap;
    position: absolute;
    width: auto;
    animation: ticker 20s linear infinite;
    display: inline-block;
  }

  @keyframes floating {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  .floating-letter {
    display: inline-block;
    animation: floating 2s ease-in-out infinite;
  }

  @keyframes hue-shift {
    0% {
      filter: hue-rotate(0deg);
    }
    100% {
      filter: hue-rotate(360deg);
    }
  }

  .hue-shift-bg {
    animation: hue-shift 30s linear infinite;
  }

  @keyframes hue-shift-mild {
    0% {
      filter: hue-rotate(-10deg);
    }
    100% {
      filter: hue-rotate(10deg);
    }
  }

  .hue-shift-bottom {
    animation: hue-shift-mild 10s linear infinite alternate;
  }
</style>