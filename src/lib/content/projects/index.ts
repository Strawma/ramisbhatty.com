import type { Project } from '../schema';

const files = import.meta.glob<{ default: Project }>('./*.content.ts', { eager: true });

export const projects = Object.values(files)
	.map((file) => file.default)
	.sort(
		(left, right) =>
			(left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER) ||
			left.title.localeCompare(right.title, 'en-GB')
	);
