<script lang="ts">
	import { nav } from '$lib/data/config';
	import { resolve } from '$app/paths';
</script>

<svelte:head>
	<title>About | Ramis Bhatty</title>
	<meta name="description" content="About Ramis Bhatty and a guide to this website." />
</svelte:head>

<p class="font-mono text-sm text-neutral-500">/ABOUT</p>
<h1>About</h1>
<p class="lead">TODO: Write a longer introduction that adds useful context beyond the homepage.</p>

<section class="border-t border-neutral-300 pt-6">
	<h2>Currently</h2>
	<p>
		TODO: Describe your internship factually: what kind of organisation or team it is, what you are
		learning, and what you can discuss publicly.
	</p>
</section>

<section class="border-t border-neutral-300 pt-6">
	<h2>This site</h2>
	<p>
		This is a record of work, education, and things I find interesting. The professional parts come
		first; the less formal corners will grow over time.
	</p>
	<ul>
		<li><a href={resolve(nav.work)}>Work and projects</a></li>
		<li><a href={resolve(nav.education)}>Education and modules</a></li>
		<li><a href={resolve(nav.blog)}>Blog</a></li>
		<li><a href={resolve(nav.interests)}>Interests</a></li>
	</ul>
</section>
