import { describe, expect, it } from 'vitest';
import {
	experience,
	findExperience,
	findModule,
	findProject,
	modules,
	projects,
	visibleExperience,
	visibleModules,
	visibleProjects
} from '../src/lib/content';

describe('main-site content visibility', () => {
	it('returns only published records from production selectors', () => {
		expect(visibleExperience()).toEqual(experience.filter((entry) => entry.status === 'published'));
		expect(visibleModules()).toEqual(modules.filter((module) => module.status === 'published'));
		expect(visibleProjects()).toEqual(projects.filter((project) => project.status === 'published'));
	});

	it('includes drafts only when explicitly requested', () => {
		expect(visibleExperience(true)).toEqual(experience);
		expect(visibleModules(true)).toEqual(modules);
		expect(visibleProjects(true)).toEqual(projects);
	});

	it('does not resolve draft detail pages in production', () => {
		for (const entry of experience.filter((item) => item.status === 'draft')) {
			expect(findExperience(entry.slug)).toBeUndefined();
			expect(findExperience(entry.slug, true)).toEqual(entry);
		}
		for (const module of modules.filter((item) => item.status === 'draft')) {
			expect(findModule(module.code)).toBeUndefined();
			expect(findModule(module.code, true)).toEqual(module);
		}
		for (const project of projects.filter((item) => item.status === 'draft')) {
			expect(findProject(project.slug)).toBeUndefined();
			expect(findProject(project.slug, true)).toEqual(project);
		}
	});

	it('keeps module marks within percentage bounds when provided', () => {
		expect(
			modules.every(
				(module) => module.mark === undefined || (module.mark >= 0 && module.mark <= 100)
			)
		).toBe(true);
	});

	it('uses the correct marks and credit weighting metadata', () => {
		expect(findModule('MATH3082', true)).toMatchObject({
			title: 'Optimisation',
			mark: 88,
			credits: 15
		});
		expect(findModule('COMP3200', true)?.credits).toBe(45);
		expect(
			modules
				.filter((module) => module.code !== 'COMP3200')
				.every((module) => module.credits === 15)
		).toBe(true);
	});
});
