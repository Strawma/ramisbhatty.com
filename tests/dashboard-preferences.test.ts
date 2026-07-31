import { describe, expect, it } from 'vitest';
import {
	constrainWindowGeometry,
	createDefaultWindowGeometries
} from '../src/lib/components/bookclub/dashboard-preferences';

describe('book-club dashboard window geometry', () => {
	it('creates a non-overflowing two-column desktop layout', () => {
		const windows = createDefaultWindowGeometries(900);

		expect(windows['current-book']).toEqual({ x: 0, y: 0, width: 900, height: 410 });
		expect(windows.suggestions.x + windows.suggestions.width).toBeLessThanOrEqual(900);
		expect(windows.chatroom.x + windows.chatroom.width).toBeLessThanOrEqual(900);
		expect(windows.suggestions.x + windows.suggestions.width).toBeLessThan(windows.chatroom.x);
	});

	it('keeps moved and resized windows reachable inside the workspace', () => {
		expect(constrainWindowGeometry({ x: 850, y: -20, width: 500, height: 100 }, 900)).toEqual({
			x: 400,
			y: 0,
			width: 500,
			height: 220
		});

		expect(constrainWindowGeometry({ x: 20, y: 40, width: 1200, height: 480 }, 900)).toEqual({
			x: 0,
			y: 40,
			width: 900,
			height: 480
		});
	});
});
