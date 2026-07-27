import type { PersonalProfile } from './schema';

export const personal = {
	introduction:
		'I am a Computer Science with Artificial Intelligence Integrated Master’s student at the University of Southampton, preparing to enter my fourth year. This site is a growing record of my work, education, and interests.',
	about:
		'I study Computer Science with Artificial Intelligence at the University of Southampton on the integrated MEng programme. I am preparing to enter my fourth year and am currently completing a research internship; I will add more about the work when I can describe it properly.',
	currentFocus: [
		{
			text: 'Completing a research internship and preparing a public account of the work.'
		},
		{
			text: 'Preparing for the fourth year of the Computer Science with Artificial Intelligence MEng.',
			href: '/education',
			linkLabel: 'Read about my education'
		},
		{
			text: 'Turning coursework and personal projects into useful, connected notes for this site.',
			href: '/work',
			linkLabel: 'Browse my work'
		}
	]
} satisfies PersonalProfile;
