import type { InterestCategory } from './schema';

export const interests: InterestCategory[] = [
	{
		slug: 'games',
		title: 'Games',
		summary: 'TODO: Add favourites, current games, or individual notes.',
		items: [],
		status: 'draft',
		order: 10
	},
	{
		slug: 'books',
		title: 'Books',
		summary: 'TODO: Add books read, favourites, and links to longer notes.',
		items: [],
		status: 'draft',
		order: 20
	},
	{
		slug: 'other-subjects',
		title: 'Other subjects',
		summary: 'TODO: Add interests that deserve their own connected pages.',
		items: [],
		status: 'draft',
		order: 30
	}
];

export function visibleInterests(includeDrafts = false): InterestCategory[] {
	return interests
		.filter((category) => includeDrafts || category.status === 'published')
		.sort(
			(left, right) =>
				(left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER) ||
				left.title.localeCompare(right.title, 'en-GB')
		);
}
