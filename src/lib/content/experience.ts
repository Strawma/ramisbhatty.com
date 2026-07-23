import type { Experience } from './schema';

export const currentExperience = {
	slug: 'internship-placeholder',
	organisation: 'TODO: Organisation',
	role: 'TODO: Internship role',
	period: 'TODO: Internship dates',
	summary:
		'TODO: Describe the organisation or team, what you are learning, and what you can discuss publicly.',
	published: false
} satisfies Experience;

export const experience: Experience[] = [currentExperience];

export function visibleExperience(includeDrafts = false): Experience[] {
	return experience.filter((entry) => includeDrafts || entry.published);
}
