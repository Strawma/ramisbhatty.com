<script>
  import { onMount } from 'svelte';
  import bounceSrc from '$lib/assets/sounds/blip.mp3';

  let width = 150;
  let height = 150;
  const minSpeed = 2;
  const maxSpeed = 15;
  export let name = "Bouncer";
  export let src = null;

  let x = 0;
  let y = 0;
  let dx = Math.floor(Math.random() * maxSpeed) + minSpeed;
  let dy = Math.floor(Math.random() * maxSpeed) + minSpeed;
  let animationFrame;
  let lastTime = performance.now();

  // Function to update the position
  function moveBouncer(timestamp) {
    function bounceSound() {
      let bounceSound = new Audio(bounceSrc);
      bounceSound.play();
    }
    const deltaTime = (timestamp - lastTime) / 16.6667;
    lastTime = timestamp;

    width = 150;
    height = 150;

    x += dx * deltaTime;
    y += dy * deltaTime;

    const containerRect = document.documentElement.getBoundingClientRect();
    // Considering viewport positions with scroll offsets
    let leftBoundary = containerRect.left;
    let topBoundary = containerRect.top;
    let rightBoundary = containerRect.right;
    let bottomBoundary = containerRect.bottom;

    // Check bounds and reverse direction if collision detected
    if (x + width >= rightBoundary) {
      if (width >= rightBoundary - leftBoundary) {
        x = leftBoundary;
        width = rightBoundary - leftBoundary;
      } else {
        x = window.innerWidth - width;
        dx = -dx;
        bounceSound();
      }
    } else if (x <= leftBoundary) {
      x = leftBoundary;
      dx = -dx;
      bounceSound();
    }
    if (y + height >= bottomBoundary) {
      if (height >= bottomBoundary - topBoundary) {
        y = topBoundary;
        height = bottomBoundary - topBoundary;
      } else {
        y = window.innerHeight - height;
        dy = -dy;
        bounceSound();
      }
    } else if (y <= topBoundary) {
      y = topBoundary;
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