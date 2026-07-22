export interface ContentLink {
	label: string;
	href: string;
	external?: boolean;
}

export interface ContentImage {
	src: string;
	alt: string;
	caption?: string;
}

export interface ContentSection {
	heading: string;
	paragraphs?: string[];
	bullets?: string[];
	links?: ContentLink[];
	images?: ContentImage[];
}

export interface AcademicModule {
	code: string;
	title: string;
	year: string;
	summary: string;
	topics: string[];
	sections: ContentSection[];
	published: boolean;
}

export interface Project {
	slug: string;
	title: string;
	summary: string;
	moduleCode?: string;
	period?: string;
	technologies: string[];
	sections: ContentSection[];
	links: ContentLink[];
	published: boolean;
}

export const profile = {
	introduction:
		'TODO: Write two or three sentences introducing yourself, your current internship, and what this site collects.',
	currentFocus: [
		'TODO: Describe the work or subject occupying most of your attention during your internship.',
		'TODO: Add a current university module, project, or idea you are exploring.'
	]
};

export const modules: AcademicModule[] = [
	{
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
	}
];

export const projects: Project[] = [
	{
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
				paragraphs: [
					'TODO: Be precise about what you designed, implemented, researched, or tested.'
				]
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
	}
];

export function visibleModules(includeDrafts = false): AcademicModule[] {
	return modules.filter((module) => includeDrafts || module.published);
}

export function visibleProjects(includeDrafts = false): Project[] {
	return projects.filter((project) => includeDrafts || project.published);
}

export function findModule(code: string, includeDrafts = false): AcademicModule | undefined {
	return visibleModules(includeDrafts).find(
		(module) => module.code.toLocaleLowerCase('en-GB') === code.toLocaleLowerCase('en-GB')
	);
}

export function findProject(slug: string, includeDrafts = false): Project | undefined {
	return visibleProjects(includeDrafts).find((project) => project.slug === slug);
}
