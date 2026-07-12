<!-- src/routes/(main)/+page.svelte -->
<script lang="ts">
	import { contact } from '$lib/data/config';
</script>

<h1>Hello! This is my Website</h1>

<p>I'm a computer science student with some interests and stuff. Check it out!</p>

<b class="flex-1 flex items-center justify-center"> Nothing </b>

<!-- contacts at bottm -->
<div class="mt-auto">
	<h2>Contact</h2>
	<ul>
		<li><a href={contact.github} rel="external">GitHub</a></li>
		<li><a href="mailto:{contact.email}">Email</a></li>
		<li><a href={contact.linkedin} rel="external">LinkedIn</a></li>
	</ul>
</div>
