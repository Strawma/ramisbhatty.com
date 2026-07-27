import { nav } from '$lib/data/config';
import type { ExploreDestination, PageIntroduction } from './schema';

export const pageIntroductions = {
	about: {
		path: '/ABOUT',
		title: 'About',
		description: 'About Ramis Bhatty and a guide to this website.',
		lead: ''
	},
	work: {
		path: '/WORK',
		title: 'Work',
		description: 'Projects and experience by Ramis Bhatty.',
		lead: 'Projects, research, and other work. Each finished entry will focus on the problem, my contribution, and what I learned.'
	},
	education: {
		path: '/EDUCATION',
		title: 'Education',
		description: 'Education, university modules, and related projects by Ramis Bhatty.',
		lead: ''
	},
	blog: {
		path: '/BLOG',
		title: 'Blog',
		description: 'Writing and notes by Ramis Bhatty.',
		lead: 'Longer notes, explanations, reviews, and ideas as I write them.'
	},
	interests: {
		path: '/INTERESTS',
		title: 'Interests',
		description: 'Games, books, and other interests collected by Ramis Bhatty.',
		lead: 'A less formal index of games, books, and other subjects I want to remember or write about.'
	},
	cv: {
		path: '/CV',
		title: 'CV',
		description: 'CV information for Ramis Bhatty.',
		lead: 'A maintained technical CV will be available here later.'
	}
} satisfies Record<string, PageIntroduction>;

export const exploreDestinations = [
	{
		title: 'Work',
		href: nav.work,
		description: 'Projects, research, and work connected to my studies.'
	},
	{
		title: 'Education',
		href: nav.education,
		description: 'My degree, modules, coursework, and the ideas that came out of studying them.'
	},
	{
		title: 'Blog',
		href: nav.blog,
		description: 'Longer notes, reviews, explanations, and ideas.'
	},
	{
		title: 'Interests',
		href: nav.interests,
		description: 'Games, books, and other things worth keeping track of.'
	}
] satisfies ExploreDestination[];

export const aboutSiteCopy = {
	heading: 'This site',
	paragraph:
		'This is a record of work, education, and things I find interesting. The professional parts come first; the less formal corners will grow over time.'
} as const;
