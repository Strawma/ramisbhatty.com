import { describe, expect, it } from 'vitest';
import {
	experience,
	findExperience,
	findInterest,
	findModule,
	findPost,
	findProject,
	interestContent,
	interests,
	modules,
	posts,
	projects,
	visibleExperience,
	visibleInterests,
	visibleModules,
	visiblePosts,
	visibleProjects
} from '../src/lib/content';

describe('main-site content visibility', () => {
	it('returns only published records from production selectors', () => {
		expect(visibleExperience()).toEqual(experience.filter((entry) => entry.status === 'published'));
		expect(visibleInterests()).toEqual(
			interests.filter((category) => category.status === 'published')
		);
		expect(visibleModules()).toEqual(modules.filter((module) => module.status === 'published'));
		expect(visiblePosts()).toEqual(posts.filter((post) => post.status === 'published'));
		expect(visibleProjects()).toEqual(projects.filter((project) => project.status === 'published'));
	});

	it('includes drafts only when explicitly requested', () => {
		expect(visibleExperience(true)).toEqual(experience);
		expect(visibleInterests(true)).toEqual(interests);
		expect(visibleModules(true)).toEqual(modules);
		expect(visiblePosts(true)).toEqual(posts);
		expect(visibleProjects(true)).toEqual(projects);
	});

	it('does not resolve draft detail pages in production', () => {
		for (const entry of experience.filter((item) => item.status === 'draft')) {
			expect(findExperience(entry.slug)).toBeUndefined();
			expect(findExperience(entry.slug, true)).toEqual(entry);
		}
		for (const category of interests.filter((item) => item.status === 'draft')) {
			expect(findInterest(category.slug)).toBeUndefined();
			expect(findInterest(category.slug, true)).toEqual(category);
		}
		for (const module of modules.filter((item) => item.status === 'draft')) {
			expect(findModule(module.code)).toBeUndefined();
			expect(findModule(module.code, true)).toEqual(module);
		}
		for (const post of posts.filter((item) => item.status === 'draft')) {
			expect(findPost(post.slug)).toBeUndefined();
			expect(findPost(post.slug, true)).toEqual(post);
		}
		for (const project of projects.filter((item) => item.status === 'draft')) {
			expect(findProject(project.slug)).toBeUndefined();
			expect(findProject(project.slug, true)).toEqual(project);
		}
	});

	it('discovers a Markdown body for every interest category', () => {
		expect(interests.every((category) => interestContent[category.slug])).toBe(true);
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
