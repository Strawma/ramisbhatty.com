export { education } from './education';
export { experience, visibleExperience } from './experience';
export { interests, visibleInterests } from './interests';
export { personal } from './personal';
export { aboutSiteCopy, exploreDestinations, pageIntroductions } from './pages';
export { modules } from './modules';
export { posts } from './posts';
export { projects } from './projects';
export type {
	AcademicModule,
	ContentImage,
	ContentLink,
	CollectionMetadata,
	ContentSection,
	EducationProfile,
	ExploreDestination,
	Experience,
	FocusItem,
	InterestCategory,
	InterestItem,
	PageIntroduction,
	PersonalProfile,
	Post,
	Project
} from './schema';

import { experience, visibleExperience } from './experience';
import { interests } from './interests';
import { modules } from './modules';
import { posts } from './posts';
import { projects } from './projects';
import type { AcademicModule, Post, Project } from './schema';

function assertUnique(label: string, values: string[]): void {
	const seen = new Set<string>();

	for (const value of values) {
		const normalized = value.toLocaleLowerCase('en-GB');
		if (seen.has(normalized)) {
			throw new Error(`Duplicate ${label}: ${value}`);
		}
		seen.add(normalized);
	}
}

assertUnique(
	'module code',
	modules.map((module) => module.code)
);
assertUnique(
	'project slug',
	projects.map((project) => project.slug)
);
assertUnique(
	'post slug',
	posts.map((post) => post.slug)
);
assertUnique(
	'experience slug',
	experience.map((entry) => entry.slug)
);
assertUnique(
	'interest slug',
	interests.map((category) => category.slug)
);

for (const project of projects) {
	if (
		project.moduleCode &&
		!modules.some(
			(module) =>
				module.code.toLocaleLowerCase('en-GB') === project.moduleCode?.toLocaleLowerCase('en-GB')
		)
	) {
		throw new Error(`Project "${project.slug}" references unknown module "${project.moduleCode}"`);
	}
}

export function visibleModules(includeDrafts = false): AcademicModule[] {
	return modules.filter((module) => includeDrafts || module.status === 'published');
}

export function visibleProjects(includeDrafts = false): Project[] {
	return projects.filter((project) => includeDrafts || project.status === 'published');
}

export function visiblePosts(includeDrafts = false): Post[] {
	return posts.filter((post) => includeDrafts || post.status === 'published');
}

export function featuredProjects(includeDrafts = false): Project[] {
	return visibleProjects(includeDrafts).filter((project) => project.featured);
}

export function featuredModules(includeDrafts = false): AcademicModule[] {
	return visibleModules(includeDrafts).filter((module) => module.featured);
}

export function findModule(code: string, includeDrafts = false): AcademicModule | undefined {
	return visibleModules(includeDrafts).find(
		(module) => module.code.toLocaleLowerCase('en-GB') === code.toLocaleLowerCase('en-GB')
	);
}

export function findProject(slug: string, includeDrafts = false): Project | undefined {
	return visibleProjects(includeDrafts).find((project) => project.slug === slug);
}

export function findPost(slug: string, includeDrafts = false): Post | undefined {
	return visiblePosts(includeDrafts).find((post) => post.slug === slug);
}

export function findExperience(slug: string, includeDrafts = false) {
	return visibleExperience(includeDrafts).find((entry) => entry.slug === slug);
}
