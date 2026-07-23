import type { Project } from '../schema';

export const moduleProjectPlaceholder = {
	slug: 'module-project-placeholder',
	title: 'TODO: Project title',
	summary: 'TODO: State what the project does and the problem it addressed.',
	moduleCode: 'COMP1201',
	period: 'TODO: Term or year',
	technologies: ['TODO: Technology or method'],
	sections: [
		{
			heading: 'Context',
			paragraphs: [
				'TODO: Explain the assignment or motivation, including constraints that shaped the work.'
			]
		},
		{
			heading: 'My contribution',
			paragraphs: ['TODO: Be precise about what you designed, implemented, researched, or tested.']
		},
		{
			heading: 'Decisions and lessons',
			paragraphs: [
				'TODO: Explain one meaningful decision, difficulty, result, or thing you would change.'
			]
		}
	],
	links: [],
	published: false
} satisfies Project;
