<script>
  import { onMount } from 'svelte';
  import bounceSrc from '$lib/assets/sounds/blip.mp3';

  const maxWidth = 150;
  const maxHeight = 150;
  let width;
  let height;
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

  function adjustSize() {
    width = Math.min(maxWidth, window.innerWidth);
    height = Math.min(maxHeight, window.innerHeight);
  }

  // Function to update the position
  function moveBouncer(timestamp) {
    function bounceSound() {
      let bounceSound = new Audio(bounceSrc);
      bounceSound.play();
    }

    // adjust size of bouncer if window size changes
    adjustSize();

    // Calculate the time delta
    const deltaTime = (timestamp - lastTime) / 16.6667;
    lastTime = timestamp;

    // Get the container's boundaries
    const containerRect = document.documentElement.getBoundingClientRect();
    let leftBoundary = containerRect.left;
    let topBoundary = containerRect.top;
    let rightBoundary = containerRect.right;
    let bottomBoundary = containerRect.bottom;

    // Update the position
    x += dx * deltaTime;
    y += dy * deltaTime;

    let bounced = false;
    // Check for collisions with the container's boundaries
    if (x + window.scrollX <= leftBoundary) {
      dx = Math.abs(dx);
      x = 0;
      bounced = true;
    } else if (x + width + window.scrollX >= rightBoundary) {
      dx = -Math.abs(dx);
      x = window.innerWidth - width;
      bounced = true;
    }

    if (y + window.scrollY <= topBoundary) {
      dy = Math.abs(dy);
      y = 0;
      bounced = true;
    } else if (y + height + window.scrollY >= bottomBoundary) {
      dy = -Math.abs(dy);
      y = window.innerHeight - height;
      bounced = true;
    }

    // play bounce sound if bouncer hits a wall
    if (bounced) {
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