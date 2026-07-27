import type { Component } from 'svelte';

export type PublicationStatus = 'draft' | 'published';

export interface CollectionMetadata {
	status: PublicationStatus;
	featured?: boolean;
	order?: number;
	updatedAt?: string;
}

export interface Experience extends CollectionMetadata {
	slug: string;
	organisation: string;
	role: string;
	period: string;
	summary: string;
}

export interface InterestCategory extends CollectionMetadata {
	slug: string;
	title: string;
	summary: string;
}

export interface AcademicModule extends CollectionMetadata {
	slug: string;
	code: string;
	title: string;
	year: string;
	summary: string;
	topics: string[];
}

export interface Project extends CollectionMetadata {
	slug: string;
	title: string;
	summary: string;
	moduleCode?: string;
	period?: string;
	technologies: string[];
}

export interface Post extends CollectionMetadata {
	slug: string;
	title: string;
	summary: string;
	publishedAt?: string;
	topics: string[];
}

export interface PageIntroduction {
	slug: string;
	path: string;
	title: string;
	description: string;
	indexDescription?: string;
	introduction?: string;
}

export interface ExploreDestination {
	title: string;
	href: '/work' | '/education' | '/blog' | '/interests';
	description: string;
}

export interface MarkdownModule<T> {
	default: Component;
	metadata: T;
}
