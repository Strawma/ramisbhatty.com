<script lang="ts">
	import { onMount } from 'svelte';
	import RamisRealSrc from '#lib/assets/images/ramis-real.webp';
	import GooberSrc from '#lib/assets/images/goober.webp';
	import FoxySrc from '#lib/assets/images/foxy-jumpscare.webp';
	import BlipSrc from '#lib/assets/sounds/blip.mp3';
	import SplatSrc from '#lib/assets/sounds/splat.mp3';
	import JumpscareSrc from '#lib/assets/sounds/jumpscare.mp3';

	let caption = $state('This is a Ramis Bhatty.');
	let ramisIsGoober = $state(false);
	let foxyVisible = $state(false);
	let foxyKey = $state(0);
	let ramisPosition = $state({ x: 0, y: 0 });
	let background = $state<number[]>([200, 200, 200]);

	let running = true;

	const pause = (milliseconds: number) =>
		new Promise((resolve) => setTimeout(resolve, milliseconds));

	const randInt = (max: number, offset = 0) => offset + Math.floor(Math.random() * max);

	function playSound(src: string) {
		// Autoplay policies can reject playback outside a user gesture; ignore those failures.
		void new Audio(src).play().catch(() => {});
	}

	function toggleRamis() {
		ramisIsGoober = !ramisIsGoober;
		caption = ramisIsGoober ? 'This is a Goober' : 'This is a Ramis Bhatty';
		playSound(SplatSrc);
	}

	async function moveRamis() {
		const blip = new Audio(BlipSrc);
		const velocity = {
			x: (1 - 2 * randInt(2)) * randInt(10, 5),
			y: (1 - 2 * randInt(2)) * randInt(10, 5)
		};
		const width = 240;
		const height = 240;

		while (running) {
			ramisPosition.x += velocity.x;
			ramisPosition.y += velocity.y;

			if (ramisPosition.x < 0 || ramisPosition.x > window.innerWidth - width) {
				velocity.x = -velocity.x;
				blip.play();
			}
			if (ramisPosition.y < 0 || ramisPosition.y > window.innerHeight - height) {
				velocity.y = -velocity.y;
				blip.play();
			}

			await pause(1000 / 30);
		}
	}

	async function startJumpscare() {
		foxyVisible = true;
		playSound(JumpscareSrc);
		await pause(2000);
		foxyVisible = false;
		foxyKey += 1;
	}

	function getDifference(start: number, end: number, interval: number) {
		return Math.floor((end - start) / interval);
	}

	async function randomBackground(currentColor: number[]) {
		const frames = 24;
		const frameTime = 1000 / frames;
		while (running) {
			const newColor = [randInt(256), randInt(256), randInt(256)];
			const delta = [0, 0, 0];
			for (let i = 0; i < 3; i++) {
				delta[i] = getDifference(currentColor[i], newColor[i], frames);
			}
			for (let j = 0; j < frames; j++) {
				await pause(frameTime);
				for (let k = 0; k < 3; k++) {
					currentColor[k] += delta[k];
					background[k] = currentColor[k];
				}
			}
		}
	}

	onMount(() => {
		moveRamis();
		randomBackground([200, 200, 200]);
		return () => {
			running = false;
		};
	});
</script>

<svelte:head>
	<title>Ramis Bhatty</title>
</svelte:head>

<div
	class="legacy"
	style="background-color: rgb({background[0]}, {background[1]}, {background[2]})"
>
	<h1>Welcome</h1>
	<p>{caption}</p>

	<button
		id="ramisToggle"
		type="button"
		onclick={toggleRamis}
		style="left: {ramisPosition.x}px; top: {ramisPosition.y}px"
	>
		<img id="ramisImage" src={ramisIsGoober ? GooberSrc : RamisRealSrc} alt="ramis" />
	</button>
	{#key foxyKey}
		<img id="foxyJumpscare" class:visible={foxyVisible} src={FoxySrc} alt="foxy" />
	{/key}

	<button id="doNotClick" type="button" onclick={startJumpscare}>Do not click</button>
</div>

<style>
	.legacy {
		position: fixed;
		inset: 0;
		overflow: hidden;
	}

	h1 {
		color: #ffffff;
	}

	p {
		color: #ffffff;
	}

	#ramisToggle {
		position: absolute;
		z-index: -1;
		padding: 0;
		border: none;
		background: none;
		cursor: pointer;
	}

	#ramisImage {
		display: block;
		width: 240px;
		height: 240px;
	}

	#doNotClick {
		font-size: 6px;
		cursor: pointer;
		position: absolute;
		bottom: 4px;
		right: 4px;
		color: blue;
		text-decoration-line: underline;
		background: none;
		border: none;
	}

	#foxyJumpscare {
		height: 100%;
		width: 100%;
		position: absolute;
		left: 0px;
		top: 0px;
		visibility: hidden;
	}

	#foxyJumpscare.visible {
		visibility: visible;
	}
</style>
