export { education } from './education';
export { currentExperience, experience, visibleExperience } from './experience';
export { interests } from './interests';
export { personal } from './personal';
export { modules } from './modules';
export { projects } from './projects';
export type {
	AcademicModule,
	ContentImage,
	ContentLink,
	ContentSection,
	EducationProfile,
	Experience,
	InterestCategory,
	PersonalProfile,
	Project
} from './schema';

import { modules } from './modules';
import { projects } from './projects';
import type { AcademicModule, Project } from './schema';

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
