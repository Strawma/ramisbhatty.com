<script lang="ts">
	// import images of ramis and goober
	import RamisSRC from '$lib/assets/images/ramis.jpg';
	import GooberSRC from '$lib/assets/images/goober.jpg';
</script>

<div class="container">
	<h1>Welcome to My Personal Webpage</h1>
	<div class="side-by-side">
		<div class="infobox">
			<h2>About Me</h2>
			<img src={RamisSRC} alt="Ramis"/>
			<p>My name is Ramis Bhatty</p>
		</div>
		<div class="infobox">
			<h2>About This Guy</h2>
			<img src={GooberSRC} alt="Goober"/>
			<p>I have no idea who this man is. Please do not try to contact him.</p>
		</div>
	</div>
	<div class="side-by-side">
		<div class="infobox">
			<h2>Contact Me</h2>
			<p>Don't</p>
		</div>
	</div>
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
    gap: 2rem;
    min-height: 100vh;
    background-color: #f0f0f0;
    width: fit-content;
    margin: 0 auto;
  }

  .side-by-side {
    display: flex;
    gap: 2rem;
    flex-wrap: wrap;
    justify-content: center; /* Center the boxes */
  }

  .infobox {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    min-width: 0; /* Allow shrinking below content size */
    flex: 1 1 250px; /* Grow, shrink, base size 250px */
    max-width: 400px; /* Prevent boxes from getting too wide */
  }

  .infobox h2 {
    margin-top: 0;
    margin-bottom: 1rem;
  }

  .infobox img {
    width: 100%;
    height: auto;
    border-radius: 4px;
    margin-bottom: 1rem;
  }
</style>
