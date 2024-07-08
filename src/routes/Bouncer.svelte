<script>
  import { onMount } from 'svelte';
  import bounceSrc from '$lib/assets/sounds/blip.mp3';

  const width = 150;
  let height = 150;
  const minSpeed = 1;
  const maxSpeed = 3;
  export let name = "Bouncer";
  export let src = null;

  let x = 0;
  let y = 0;
  let dx = Math.floor(Math.random() * maxSpeed) + minSpeed;
  let dy = Math.floor(Math.random() * maxSpeed) + minSpeed;
  let animationFrame;

  // Function to update the position
  function moveBouncer() {
    function bounceSound() {
      let bounceSound = new Audio(bounceSrc);
      bounceSound.play();
    }

    height = 150;

    x += dx;
    y += dy;

    // Check bounds and reverse direction if collision detected
    if (x + width >= window.innerWidth) {
      x = window.innerWidth - width;
      dx = -dx;
      bounceSound();
    } else if (x <= 0) {
      x = 0;
      dx = -dx;
      bounceSound();
    }
    if (y + height >= window.innerHeight) {
      if (height > window.innerHeight) {
        y = 0;
        height = window.innerHeight;
      } else {
        y = window.innerHeight - height;
        dy = -dy;
        bounceSound();
      }
    } else if (y <= 0) {
      y = 0;
      dy = -dy;
      bounceSound();
    }
    // Request the next frame
    animationFrame = requestAnimationFrame(moveBouncer);
  }

  // Start the animation when the component is mounted
  onMount(() => {
    // Start the animation
    animationFrame = requestAnimationFrame(moveBouncer);

    // Cleanup function to cancel the animation frame when the component is unmounted
    return () => cancelAnimationFrame(animationFrame);
  });
</script>

<style>
  .invisible-button {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    position: absolute;
  }
  .invisible-button:focus {
    outline: 2px solid #000; /* Provide a visual indicator for keyboard focus */
  }
  .invisible-button img {
    display: block;
  }
</style>

<button class="invisible-button" style="left: {x}px; top: {y}px;" on:click>
  <img src={src} alt={name} width={width} height={height}/>
</button>