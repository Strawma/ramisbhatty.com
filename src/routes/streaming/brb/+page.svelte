<script lang="ts">
	import WindowsSRC from '$lib/assets/images/windows-xp.png';
	import WindowsBottomSRC from '$lib/assets/images/windows-xp-bottom.png';
	import JimSRC from '$lib/assets/images/jim.png';

	const brbText = "Be Right Back!";
</script>

<div class="w-full h-screen relative">
	<!-- BRB Text -->
	<div class="absolute top-55/100 left-33/100 -translate-x-1/2 -translate-y-1/2 text-white text-9xl font-bold z-30 px-8 py-4"
			 style="font-family: 'pixel-sans', cursive, sans-serif; text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);">
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
	<!-- Background images -->
	<img src={WindowsSRC} alt="Windows XP" class="absolute w-full h-full object-cover z-0" />
	<img
		src={JimSRC}
		alt="Jim"
		class="absolute h-[90%] top-1/2 left-3/4 -translate-y-1/2 -translate-x-1/2 object-contain z-10 rotating-image"
	/>
	<img src={WindowsBottomSRC} alt="Windows XP Bottom" class="absolute w-full h-full object-cover z-20" />
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
</style>