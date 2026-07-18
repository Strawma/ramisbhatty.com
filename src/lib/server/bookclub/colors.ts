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

export function isValidChatColor(value: string): boolean {
	return CHAT_COLOR_PATTERN.test(value);
}

export function normalizeChatColor(value: string): string {
	return value.toLowerCase();
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
