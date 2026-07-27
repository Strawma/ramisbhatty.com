import type { Experience } from '../schema';

const files = import.meta.glob<{ default: Experience }>('./*.content.ts', { eager: true });

export const experience = Object.values(files)
	.map((file) => file.default)
	.sort(
		(left, right) =>
			(left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER) ||
			left.role.localeCompare(right.role, 'en-GB')
	);

export function visibleExperience(includeDrafts = false): Experience[] {
	return experience.filter((entry) => includeDrafts || entry.status === 'published');
}
