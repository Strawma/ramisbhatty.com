import { describe, expect, it, vi } from 'vitest';
import { handle } from '../src/hooks.server';

type HandleInput = Parameters<typeof handle>[0];

function request(url: string) {
	const event = { url: new URL(url) } as HandleInput['event'];
	const response = new Response('Page content');
	const resolve = vi.fn(async () => response);
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
		expect(resolve).toHaveBeenCalledWith(event);
	});
});
