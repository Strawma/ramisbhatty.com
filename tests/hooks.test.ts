import { describe, expect, it, vi } from 'vitest';
import { handle } from '../src/hooks.server';

type HandleInput = Parameters<typeof handle>[0];

const SAMPLE_HTML =
	'<!doctype html><html lang="en"><head><meta name="color-scheme" content="light dark" /></head><body></body></html>';

function request(url: string, themeCookie?: string) {
	const event = {
		url: new URL(url),
		cookies: {
			get: (name: string) => (name === 'theme' ? themeCookie : undefined)
		}
	} as unknown as HandleInput['event'];
	const response = new Response('Page content');
	const resolve = vi.fn<HandleInput['resolve']>(async () => response);
	return { event, response, resolve };
}

describe('Pages hostname redirects', () => {
	it('redirects the production Pages alias while preserving its path and query', async () => {
		const { event, resolve } = request(
			'https://ramisbhatty-com-ect.pages.dev/education?view=modules'
		);
		const result = await handle({ event, resolve });
		expect(result.status).toBe(308);
		expect(result.headers.get('location')).toBe('https://ramisbhatty.com/education?view=modules');
		expect(resolve).not.toHaveBeenCalled();
	});

	it.each([
		'https://dev.ramisbhatty-com-ect.pages.dev/education',
		'https://e502975b.ramisbhatty-com-ect.pages.dev/education',
		'https://feature-example.ramisbhatty-com-ect.pages.dev/education',
		'https://ramisbhatty.com/education',
		'https://www.ramisbhatty.com/education',
		'http://localhost:5173/education'
	])('serves %s without redirecting to production', async (url) => {
		const { event, response, resolve } = request(url);
		const result = await handle({ event, resolve });
		expect(result).toBe(response);
		expect(resolve).toHaveBeenCalledWith(event, {
			transformPageChunk: expect.any(Function)
		});
	});
});

describe('SSR theme chunk transform', () => {
	it('renders the persisted dark theme before external styles load', async () => {
		const { event, resolve } = request('https://ramisbhatty.com/', 'dark');
		await handle({ event, resolve });
		const transform = resolve.mock.calls[0]?.[1]?.transformPageChunk;
		const html = await transform?.({ html: SAMPLE_HTML, done: true });

		expect(html).toContain(
			'<html lang="en" class="dark" style="color-scheme: dark; background-color: #0a0a0a;">'
		);
		expect(html).toContain('<meta name="color-scheme" content="dark" />');
		expect(html).toContain('background-color:#0a0a0a');
	});

	it('renders the persisted light theme explicitly when stored in a cookie', async () => {
		const { event, resolve } = request('https://ramisbhatty.com/cv', 'light');
		await handle({ event, resolve });
		const transform = resolve.mock.calls[0]?.[1]?.transformPageChunk;
		const html = await transform?.({ html: SAMPLE_HTML, done: true });

		expect(html).toContain(
			'<html lang="en" class="light" style="color-scheme: light; background-color: #fafafa;">'
		);
		expect(html).toContain('<meta name="color-scheme" content="light" />');
	});

	it('falls back to system color-scheme CSS when no theme cookie exists', async () => {
		const { event, resolve } = request('https://ramisbhatty.com/');
		await handle({ event, resolve });
		const transform = resolve.mock.calls[0]?.[1]?.transformPageChunk;
		const html = await transform?.({ html: SAMPLE_HTML, done: true });

		expect(html).toContain('<html lang="en"><head>');
		expect(html).toContain('<meta name="color-scheme" content="light dark" />');
		expect(html).toContain('@media (prefers-color-scheme:dark)');
	});

	it.each([
		'https://ramisbhatty.com/silly',
		'https://ramisbhatty.com/silly/who-is-ramis-bhatty',
		'https://ramisbhatty.com/bookclub/login',
		'https://ramisbhatty.com/streaming/brb'
	])('keeps fixed-palette route %s light even when theme=dark cookie is set', async (url) => {
		const { event, resolve } = request(url, 'dark');
		await handle({ event, resolve });
		const transform = resolve.mock.calls[0]?.[1]?.transformPageChunk;
		const html = await transform?.({ html: SAMPLE_HTML, done: true });

		expect(html).toContain('<html lang="en"><head>');
		expect(html).toContain('<meta name="color-scheme" content="light" />');
		expect(html).not.toContain('class="dark"');
		expect(html).not.toContain('#0a0a0a');
	});
});
