<script lang="ts">
  import RamisSrc from '$lib/assets/images/ramis.jpg';
  import GooberSrc from '$lib/assets/images/goober.jpg';
  import SplatSource from '$lib/assets/sounds/splat.mp3';
  import Bouncer from "./Bouncer.svelte";
  import './RainbowBody.css';

  const bouncerSrcs = [RamisSrc, GooberSrc];
  const bouncerNames = ["Ramis", "Goober"];
  let bouncerIndex = 0;
  $: bouncerName = bouncerNames[bouncerIndex];
  $: bouncerSrc = bouncerSrcs[bouncerIndex];

  function handleClick() {
    bouncerIndex = 1 - bouncerIndex;
    //play splat noise
    let splatSound = new Audio(SplatSource);
    splatSound.play();
  }
</script>

<main class="flex flex-col items-center justify-center h-screen">
  <h1 class="font-[Comic_Sans_MS]">This is a {bouncerName}</h1>
  <Bouncer name={bouncerName} src={bouncerSrc} on:click={handleClick} />
</main>

