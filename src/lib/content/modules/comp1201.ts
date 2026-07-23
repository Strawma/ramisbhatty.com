import type { AcademicModule } from '../schema';

export const comp1201 = {
	code: 'COMP1201',
	title: 'TODO: Module title',
	year: 'TODO: Academic year or level',
	summary: 'TODO: Explain the module in one or two factual sentences.',
	topics: ['TODO: Topic one', 'TODO: Topic two'],
	sections: [
		{
			heading: 'What the module covered',
			paragraphs: [
				'TODO: Describe the important ideas in your own words rather than copying a module catalogue.'
			]
		},
		{
			heading: 'What I took from it',
			paragraphs: [
				'TODO: Record what changed in your understanding, what challenged you, or what you want to revisit.'
			]
		}
	],
	published: false
} satisfies AcademicModule;
