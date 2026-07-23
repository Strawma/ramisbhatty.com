import type { PersonalProfile } from './schema';

export const personal = {
	introduction:
		'TODO: Write two or three sentences introducing yourself, your current internship, and what this site collects.',
	about: 'TODO: Write a longer introduction that adds useful context beyond the homepage.',
	currentFocus: [
		'TODO: Describe the work or subject occupying most of your attention during your internship.',
		'TODO: Add a current university module, project, or idea you are exploring.'
	]
} satisfies PersonalProfile;
