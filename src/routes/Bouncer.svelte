<script lang="ts">
  import { onMount } from 'svelte';
  import bounceSrc from '$lib/assets/sounds/blip.mp3';

  const maxWidth = 150;
  const maxHeight = 150;
  let width: number;
  let height: number;
  const minSpeed = 2;
  const maxSpeed = 15;
  export let name = "Bouncer";
  export let src = "";

  let x = 0;
  let y = 0;
  let dx = Math.floor(Math.random() * maxSpeed) + minSpeed;
  let dy = Math.floor(Math.random() * maxSpeed) + minSpeed;
  let animationFrame: number;
  let lastTime = performance.now();

  function adjustSize() {
    width = Math.min(maxWidth, window.innerWidth);
    height = Math.min(maxHeight, window.innerHeight);
  }

  // Function to update the position
  function moveBouncer(timestamp: number) {
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

<button class="bg-transparent border-0 p-0 cursor-pointer absolute focus:outline-none focus:ring-2 focus:ring-black block rounded-full"
               style="left: {x}px; top: {y}px;"
               on:click>
  <img class="block object-fill rounded-full"
       style="width: {width}px; height: {height}px;"
       src={src} alt={name}/>
</button>