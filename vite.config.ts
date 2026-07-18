import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const buildTimestamp = new Date().toISOString();

export default defineConfig({
	define: {
		__BUILD_TIMESTAMP__: JSON.stringify(buildTimestamp)
	},
	plugins: [tailwindcss(), sveltekit()]
});
