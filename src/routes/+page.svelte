<script>
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

<main>
  <h1>This is a {bouncerName}</h1>
  <Bouncer name={bouncerName} bind:src={bouncerSrc} on:click={handleClick} />
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
  }
</style>

