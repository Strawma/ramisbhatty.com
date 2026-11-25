export const SILLY_HORROR_STORAGE_KEY = 'silly-horror-mode';

export function parseSillyHorrorPreference(value: string | null | undefined): boolean {
	return value === '1';
}

export const HORROR_ARCHIVE_RECORDS: readonly string[] = [
	'SIGNAL LOG 04-A: A 56k dial-up handshake has been repeating from the Bournemouth seafront since 03:14 UTC. No carrier has claimed the line.',
	'VISITOR LEDGER: The hit counter stopped advancing in October 1998. Every refresh since then has only changed the number of reflections behind you.',
	'BROWSER ADVISORY: Netscape Navigator 4.0 users report an extra scroll bar appearing below the fold after midnight. Do not drag it.',
	'MONITOR NOTICE: If you see a second face in the dark glass beside your reflection, reduce brightness and step away from the desk.',
	'TAPE DECK REPORT: The MIDI player resumed playback on three disconnected machines at 03:11. All tracks played two semitones flat.',
	'ARCHIVE FRAGMENT 19: The blue animated sprite in the banner is no longer stored inside the image file. Clearing your cache will not remove it.',
	'CHANNEL 04 NOTICE: Emergency broadcast tests are scheduled for every Tuesday at 03:14. Today is not Tuesday.',
	'SYSTEM LOG: An outbound message was queued to advertising@ramisbhatty.com from your terminal before this page finished loading.'
];

export function getHorrorClickMessage(clicks: number): string {
	if (clicks <= 0) return '';
	if (clicks === 1) return 'It heard that.';
	if (clicks === 2) return 'Please stop pressing it.';
	if (clicks === 3) return 'The hallway lock just clicked.';
	if (clicks === 4) return 'That was not your cursor.';
	return `Signal locked. ${clicks} transmissions logged.`;
}

const HORROR_EPOCH_MS = Date.UTC(1998, 9, 31, 3, 14, 59);

function padTwo(value: number): string {
	return String(value).padStart(2, '0');
}

export function formatHorrorTimestamp(elapsedSeconds: number): string {
	const safeSeconds = Math.max(0, Math.floor(elapsedSeconds));
	const date = new Date(HORROR_EPOCH_MS - safeSeconds * 1000);
	const year = date.getUTCFullYear();
	const month = padTwo(date.getUTCMonth() + 1);
	const day = padTwo(date.getUTCDate());
	const hours = padTwo(date.getUTCHours());
	const minutes = padTwo(date.getUTCMinutes());
	const seconds = padTwo(date.getUTCSeconds());
	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
