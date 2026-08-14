<script lang="ts">
	import ClubhouseBackdrop from '#lib/components/bookclub/ClubhouseBackdrop.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/bookclub/favicon.ico" type="image/x-icon" />
	<meta name="robots" content="noindex, nofollow" />
	<meta name="referrer" content="origin" />
</svelte:head>

<div class="bookclub-theme relative isolate min-h-screen overflow-hidden bg-[#008080]">
	<ClubhouseBackdrop />
	<div class="relative z-10 min-h-screen">
		{@render children()}
	</div>
</div>

<style>
	.bookclub-theme {
		--pixel-teal:
			linear-gradient(
				112deg,
				transparent 0 18%,
				rgb(255 255 255 / 0.035) 18% 31%,
				transparent 31% 61%,
				rgb(0 0 0 / 0.045) 61% 73%,
				transparent 73% 100%
			),
			linear-gradient(
				28deg,
				rgb(255 255 255 / 0.02) 0 16%,
				transparent 16% 44%,
				rgb(0 0 0 / 0.025) 44% 57%,
				transparent 57% 84%,
				rgb(255 255 255 / 0.018) 84% 100%
			);
		--pixel-panel:
			linear-gradient(
				130deg,
				rgb(255 255 255 / 0.085) 0 13%,
				transparent 13% 37%,
				rgb(0 0 0 / 0.03) 37% 51%,
				transparent 51% 77%,
				rgb(255 255 255 / 0.035) 77% 100%
			),
			linear-gradient(
				35deg,
				transparent 0 23%,
				rgb(0 0 0 / 0.02) 23% 35%,
				transparent 35% 62%,
				rgb(255 255 255 / 0.03) 62% 75%,
				transparent 75% 100%
			);
		--pixel-chrome:
			linear-gradient(
				118deg,
				rgb(255 255 255 / 0.06) 0 18%,
				transparent 18% 43%,
				rgb(0 0 0 / 0.03) 43% 57%,
				transparent 57% 82%,
				rgb(255 255 255 / 0.025) 82% 100%
			),
			linear-gradient(
				12deg,
				transparent 0 30%,
				rgb(255 255 255 / 0.025) 30% 43%,
				transparent 43% 69%,
				rgb(0 0 0 / 0.02) 69% 80%,
				transparent 80% 100%
			);
		--pixel-title:
			linear-gradient(
				90deg,
				rgb(255 255 255 / 0.07) 0 12%,
				transparent 12% 41%,
				rgb(0 0 0 / 0.07) 41% 56%,
				transparent 56% 82%,
				rgb(255 255 255 / 0.03) 82% 100%
			),
			linear-gradient(
				0deg,
				rgb(255 255 255 / 0.025) 0 19%,
				transparent 19% 66%,
				rgb(0 0 0 / 0.045) 66% 80%,
				transparent 80% 100%
			);
		background-image: var(--pixel-teal);
		background-repeat: no-repeat;
	}

	/* These shared fills keep every book-club route within the same deliberately striped palette. */
	.bookclub-theme :global([class~='bg-[#d4d0c8]']) {
		background-image: var(--pixel-panel);
		background-repeat: no-repeat;
	}

	.bookclub-theme :global([class~='bg-[#c0c0c0]']) {
		background-image: var(--pixel-chrome);
		background-repeat: no-repeat;
	}

	.bookclub-theme :global([class~='bg-[#808080]']) {
		background-image: var(--pixel-title);
		background-repeat: no-repeat;
	}

	.bookclub-theme :global([class~='bg-[#000080]']),
	.bookclub-theme :global([class~='bg-[#800080]']),
	.bookclub-theme :global([class~='bg-[#800000]']),
	.bookclub-theme :global([class~='bg-[#008080]']) {
		background-image: var(--pixel-title);
		background-repeat: no-repeat;
	}

	.bookclub-theme :global([class~='bg-[#ffffcc]']) {
		background-image:
			linear-gradient(
				130deg,
				rgb(255 255 255 / 0.11) 0 14%,
				transparent 14% 39%,
				rgb(128 96 0 / 0.025) 39% 53%,
				transparent 53% 79%,
				rgb(255 255 255 / 0.04) 79% 100%
			),
			linear-gradient(
				35deg,
				transparent 0 27%,
				rgb(128 96 0 / 0.018) 27% 39%,
				transparent 39% 67%,
				rgb(255 255 255 / 0.035) 67% 79%,
				transparent 79% 100%
			);
		background-repeat: no-repeat;
	}
</style>
