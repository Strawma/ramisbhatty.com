<script lang="ts">
	import WindowsSRC from '$lib/assets/images/windows-xp.png';
	import WindowsBottomSRC from '$lib/assets/images/windows-xp-bottom.png';
	import JimSRC from '$lib/assets/images/jim.png';

	const brbText = "Be Right Back!";
</script>

<div class="w-full h-screen relative">
	<!-- BRB Text -->
	<div class="absolute top-55/100 left-4/100 -translate-y-1/2 text-white font-bold z-30 text-container">
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
	<!-- BRB Bonus Text -->

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
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .rotating-image {
    animation: slow-rotation 20s linear infinite;
  }

		 /* Add this to your existing styles */
	.text-container {
	 white-space: nowrap;
	 max-width: 90vw;
	 font-family: 'pixel-sans', cursive, sans-serif;
	 text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
	 font-size: clamp(1rem, 10vw, 10rem);
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