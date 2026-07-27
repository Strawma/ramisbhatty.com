import type { Component } from 'svelte';
import type {
	AcademicModule,
	CollectionMetadata,
	Experience,
	ExploreDestination,
	InterestCategory,
	MarkdownModule,
	PageIntroduction,
	Post,
	Project
} from './schema';

export type {
	AcademicModule,
	CollectionMetadata,
	Experience,
	ExploreDestination,
	InterestCategory,
	PageIntroduction,
	Post,
	Project,
	PublicationStatus
} from './schema';

type MetadataRecord = Record<string, unknown>;
type CollectionRecord = CollectionMetadata & { slug: string };
type ContentFiles = Record<string, MarkdownModule<MetadataRecord>>;

interface LoadedContent<T> {
	records: T[];
	components: Record<string, Component>;
}

function slugFromPath(path: string): string {
	const filename = path.split('/').at(-1);
	if (!filename?.endsWith('.md')) {
		throw new Error(`Unable to derive a content slug from "${path}"`);
	}
	return filename.slice(0, -3);
}

function requireString(metadata: MetadataRecord, field: string, source: string): string {
	const value = metadata[field];
	if (typeof value !== 'string' || !value.trim()) {
		throw new Error(`Missing "${field}" in ${source}`);
	}
	return value;
}

function optionalString(
	metadata: MetadataRecord,
	field: string,
	source: string
): string | undefined {
	const value = metadata[field];
	if (value === undefined) return undefined;
	if (typeof value !== 'string' || !value.trim()) {
		throw new Error(`Invalid "${field}" in ${source}`);
	}
	return value;
}

function stringList(metadata: MetadataRecord, field: string, source: string): string[] {
	const value = metadata[field];
	if (value === undefined) return [];
	if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
		throw new Error(`Invalid "${field}" in ${source}`);
	}
	return value;
}

function collectionMetadata(
	metadata: MetadataRecord,
	source: string
): Omit<CollectionMetadata, 'status'> & Pick<CollectionMetadata, 'status'> {
	const status = metadata.status;
	if (status !== 'draft' && status !== 'published') {
		throw new Error(`Invalid "status" in ${source}`);
	}

	const featured = metadata.featured;
	if (featured !== undefined && typeof featured !== 'boolean') {
		throw new Error(`Invalid "featured" in ${source}`);
	}

	const order = metadata.order;
	if (order !== undefined && typeof order !== 'number') {
		throw new Error(`Invalid "order" in ${source}`);
	}

	return {
		status,
		featured,
		order,
		updatedAt: optionalString(metadata, 'updatedAt', source)
	};
}

function loadContent<T>(
	files: ContentFiles,
	createRecord: (slug: string, metadata: MetadataRecord, source: string) => T,
	sort: (left: T, right: T) => number
): LoadedContent<T> {
	const records: T[] = [];
	const components: Record<string, Component> = {};

	for (const [source, file] of Object.entries(files)) {
		const slug = slugFromPath(source);
		if (components[slug]) {
			throw new Error(`Duplicate content slug: ${slug}`);
		}
		records.push(createRecord(slug, file.metadata, source));
		components[slug] = file.default;
	}

	records.sort(sort);
	return { records, components };
}

const byOrderThen = <T extends { order?: number }>(
	label: (record: T) => string
): ((left: T, right: T) => number) => {
	return (left, right) =>
		(left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER) ||
		label(left).localeCompare(label(right), 'en-GB');
};

const pageDocuments = loadContent(
	import.meta.glob<MarkdownModule<MetadataRecord>>('../../content/pages/*.md', { eager: true }),
	(slug, metadata, source): PageIntroduction => ({
		slug,
		path: requireString(metadata, 'path', source),
		title: requireString(metadata, 'title', source),
		description: requireString(metadata, 'description', source),
		indexDescription: optionalString(metadata, 'indexDescription', source),
		introduction: optionalString(metadata, 'introduction', source)
	}),
	(left, right) => left.slug.localeCompare(right.slug, 'en-GB')
);

export const pageIntroductions = Object.fromEntries(
	pageDocuments.records.map((page) => [page.slug, page])
) as Record<string, PageIntroduction>;
export const pageContent = pageDocuments.components;

const projectDocuments = loadContent(
	import.meta.glob<MarkdownModule<MetadataRecord>>('../../content/projects/*.md', { eager: true }),
	(slug, metadata, source): Project => ({
		slug,
		title: requireString(metadata, 'title', source),
		summary: requireString(metadata, 'summary', source),
		moduleCode: optionalString(metadata, 'moduleCode', source),
		period: optionalString(metadata, 'period', source),
		technologies: stringList(metadata, 'technologies', source),
		...collectionMetadata(metadata, source)
	}),
	byOrderThen((project) => project.title)
);
export const projects = projectDocuments.records;
export const projectContent = projectDocuments.components;

const experienceDocuments = loadContent(
	import.meta.glob<MarkdownModule<MetadataRecord>>('../../content/experience/*.md', {
		eager: true
	}),
	(slug, metadata, source): Experience => ({
		slug,
		organisation: requireString(metadata, 'organisation', source),
		role: requireString(metadata, 'role', source),
		period: requireString(metadata, 'period', source),
		summary: requireString(metadata, 'summary', source),
		...collectionMetadata(metadata, source)
	}),
	byOrderThen((entry) => entry.role)
);
export const experience = experienceDocuments.records;
export const experienceContent = experienceDocuments.components;

const moduleDocuments = loadContent(
	import.meta.glob<MarkdownModule<MetadataRecord>>('../../content/modules/*.md', { eager: true }),
	(_slug, metadata, source): AcademicModule => ({
		slug: requireString(metadata, 'code', source).toLocaleLowerCase('en-GB'),
		code: requireString(metadata, 'code', source),
		title: requireString(metadata, 'title', source),
		year: requireString(metadata, 'year', source),
		summary: requireString(metadata, 'summary', source),
		topics: stringList(metadata, 'topics', source),
		...collectionMetadata(metadata, source)
	}),
	byOrderThen((module) => module.code)
);
export const modules = moduleDocuments.records;
export const moduleContent = moduleDocuments.components;

const postDocuments = loadContent(
	import.meta.glob<MarkdownModule<MetadataRecord>>('../../content/posts/*.md', { eager: true }),
	(slug, metadata, source): Post => ({
		slug,
		title: requireString(metadata, 'title', source),
		summary: requireString(metadata, 'summary', source),
		publishedAt: optionalString(metadata, 'publishedAt', source),
		topics: stringList(metadata, 'topics', source),
		...collectionMetadata(metadata, source)
	}),
	(left, right) =>
		(right.publishedAt ?? '').localeCompare(left.publishedAt ?? '', 'en-GB') ||
		byOrderThen<Post>((post) => post.title)(left, right)
);
export const posts = postDocuments.records;
export const postContent = postDocuments.components;

const interestDocuments = loadContent(
	import.meta.glob<MarkdownModule<MetadataRecord>>('../../content/interests/*.md', { eager: true }),
	(slug, metadata, source): InterestCategory => ({
		slug,
		title: requireString(metadata, 'title', source),
		summary: requireString(metadata, 'summary', source),
		...collectionMetadata(metadata, source)
	}),
	byOrderThen((category) => category.title)
);
export const interests = interestDocuments.records;
export const interestContent = interestDocuments.components;

function assertUnique(label: string, values: string[]): void {
	const seen = new Set<string>();
	for (const value of values) {
		const normalized = value.toLocaleLowerCase('en-GB');
		if (seen.has(normalized)) throw new Error(`Duplicate ${label}: ${value}`);
		seen.add(normalized);
	}
}

assertUnique(
	'page path',
	pageDocuments.records.map((page) => page.path)
);
assertUnique(
	'module code',
	modules.map((module) => module.code)
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

function visible<T extends CollectionRecord>(records: T[], includeDrafts: boolean): T[] {
	return records.filter((record) => includeDrafts || record.status === 'published');
}

export const visibleExperience = (includeDrafts = false): Experience[] =>
	visible(experience, includeDrafts);
export const visibleInterests = (includeDrafts = false): InterestCategory[] =>
	visible(interests, includeDrafts);
export const visibleModules = (includeDrafts = false): AcademicModule[] =>
	visible(modules, includeDrafts);
export const visiblePosts = (includeDrafts = false): Post[] => visible(posts, includeDrafts);
export const visibleProjects = (includeDrafts = false): Project[] =>
	visible(projects, includeDrafts);

export const featuredProjects = (includeDrafts = false): Project[] =>
	visibleProjects(includeDrafts).filter((project) => project.featured);
export const featuredModules = (includeDrafts = false): AcademicModule[] =>
	visibleModules(includeDrafts).filter((module) => module.featured);

export function findModule(code: string, includeDrafts = false): AcademicModule | undefined {
	return visibleModules(includeDrafts).find(
		(module) => module.code.toLocaleLowerCase('en-GB') === code.toLocaleLowerCase('en-GB')
	);
}

export const findProject = (slug: string, includeDrafts = false): Project | undefined =>
	visibleProjects(includeDrafts).find((project) => project.slug === slug);
export const findPost = (slug: string, includeDrafts = false): Post | undefined =>
	visiblePosts(includeDrafts).find((post) => post.slug === slug);
export const findExperience = (slug: string, includeDrafts = false): Experience | undefined =>
	visibleExperience(includeDrafts).find((entry) => entry.slug === slug);
export const findInterest = (slug: string, includeDrafts = false): InterestCategory | undefined =>
	visibleInterests(includeDrafts).find((category) => category.slug === slug);

const exploreSlugs = ['work', 'education', 'blog', 'interests'];
export const exploreDestinations: ExploreDestination[] = exploreSlugs.map((slug) => {
	const page = pageIntroductions[slug];
	if (!page?.indexDescription) {
		throw new Error(`Missing "indexDescription" for page "${slug}"`);
	}
	return {
		title: page.title,
		href: `/${slug}` as ExploreDestination['href'],
		description: page.indexDescription
	};
});
