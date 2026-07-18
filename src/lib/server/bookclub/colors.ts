// These colors stay bright enough to read against the chatroom's black background.
export const BOOKCLUB_CHAT_COLORS = [
	'#22d3ee',
	'#f472b6',
	'#a3e635',
	'#facc15',
	'#fb923c',
	'#c084fc',
	'#2dd4bf',
	'#fb7185',
	'#60a5fa',
	'#bef264',
	'#e879f9',
	'#fbbf24'
] as const;

const CHAT_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
const MINIMUM_BLACK_CONTRAST = 4.5;

export function isValidChatColor(value: string): boolean {
	return CHAT_COLOR_PATTERN.test(value);
}

export function normalizeChatColor(value: string): string {
	return value.toLowerCase();
}

function relativeLuminance(value: string): number {
	const channels = [0, 2, 4].map(
		(offset) => Number.parseInt(value.slice(offset + 1, offset + 3), 16) / 255
	);
	const linearChannels = channels.map((channel) =>
		channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
	);

	return 0.2126 * linearChannels[0] + 0.7152 * linearChannels[1] + 0.0722 * linearChannels[2];
}

export function isReadableChatColor(value: string): boolean {
	return (
		isValidChatColor(value) && (relativeLuminance(value) + 0.05) / 0.05 >= MINIMUM_BLACK_CONTRAST
	);
}

/** Build an atomic SQL expression that picks the first palette color not already in use. */
export function getChatColorAssignment(): { expression: string; bindings: string[] } {
	const clauses = BOOKCLUB_CHAT_COLORS.map(
		() => 'WHEN NOT EXISTS (SELECT 1 FROM bookclub_members WHERE chat_color = ?) THEN ?'
	).join(' ');

	return {
		expression: `CASE ${clauses} ELSE ? END`,
		bindings: [...BOOKCLUB_CHAT_COLORS.flatMap((color) => [color, color]), BOOKCLUB_CHAT_COLORS[0]]
	};
}
