import type { Post } from '../schema';

const files = import.meta.glob<{ default: Post }>('./*.content.ts', { eager: true });

export const posts = Object.values(files)
	.map((file) => file.default)
	.sort(
		(left, right) =>
			(right.publishedAt ?? '').localeCompare(left.publishedAt ?? '', 'en-GB') ||
			(left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER) ||
			left.title.localeCompare(right.title, 'en-GB')
	);
