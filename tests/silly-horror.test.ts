import { describe, expect, it } from 'vitest';
import {
	formatHorrorTimestamp,
	getHorrorClickMessage,
	HORROR_ARCHIVE_RECORDS,
	parseSillyHorrorPreference
} from '../src/routes/silly/silly-horror-data';

describe('silly analogue-horror mode helpers', () => {
	it('parses only explicit horror opt-in values', () => {
		expect(parseSillyHorrorPreference('1')).toBe(true);
		expect(parseSillyHorrorPreference('0')).toBe(false);
		expect(parseSillyHorrorPreference('dark')).toBe(false);
		expect(parseSillyHorrorPreference(null)).toBe(false);
		expect(parseSillyHorrorPreference(undefined)).toBe(false);
	});

	it('escalates click warnings across consecutive presses', () => {
		expect(getHorrorClickMessage(0)).toBe('');
		expect(getHorrorClickMessage(1)).toBe('It heard that.');
		expect(getHorrorClickMessage(2)).toBe('Please stop pressing it.');
		expect(getHorrorClickMessage(3)).toBe('The hallway lock just clicked.');
		expect(getHorrorClickMessage(4)).toBe('That was not your cursor.');
		expect(getHorrorClickMessage(5)).toBe('Signal locked. 5 transmissions logged.');
		expect(getHorrorClickMessage(12)).toBe('Signal locked. 12 transmissions logged.');
	});

	it('counts backwards cleanly from the 1998 broadcast timestamp', () => {
		expect(formatHorrorTimestamp(0)).toBe('1998-10-31 03:14:59');
		expect(formatHorrorTimestamp(59)).toBe('1998-10-31 03:14:00');
		expect(formatHorrorTimestamp(60)).toBe('1998-10-31 03:13:59');
		expect(formatHorrorTimestamp(-5)).toBe('1998-10-31 03:14:59');
	});

	it('provides non-empty emergency archive records', () => {
		expect(HORROR_ARCHIVE_RECORDS.length).toBeGreaterThanOrEqual(5);
		expect(HORROR_ARCHIVE_RECORDS.every((record) => record.trim().length > 0)).toBe(true);
	});
});
