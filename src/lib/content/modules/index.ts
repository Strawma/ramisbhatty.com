import type { AcademicModule } from '../schema';

const files = import.meta.glob<{ default: AcademicModule }>('./*.content.ts', { eager: true });

export const modules = Object.values(files)
	.map((file) => file.default)
	.sort(
		(left, right) =>
			(left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER) ||
			left.code.localeCompare(right.code, 'en-GB')
	);
