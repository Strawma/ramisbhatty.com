import type { Component } from 'svelte';

export type PublicationStatus = 'draft' | 'published';

export interface CollectionMetadata {
	status: PublicationStatus;
	featured?: boolean;
	order?: number;
	updatedAt?: string;
	related?: string[];
}

export interface Experience extends CollectionMetadata {
	slug: string;
	organisation: string;
	role: string;
	period: string;
	summary: string;
}

export interface AcademicModule extends CollectionMetadata {
	slug: string;
	code: string;
	title: string;
	year: string;
	semester?: string;
	mark?: number;
	credits: number;
	summary: string;
	skills: string[];
	technologies: string[];
}

export interface AcademicYearDetails {
	year: string;
	awards: string[];
	ongoing: boolean;
}

export interface Project extends CollectionMetadata {
	slug: string;
	title: string;
	summary: string;
	moduleCode?: string;
	period?: string;
	technologies: string[];
}

export interface BlogPost extends CollectionMetadata {
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
	introduction?: string;
	academicYears?: AcademicYearDetails[];
	related?: string[];
}

interface MarkdownModule<T> {
	default: Component;
	metadata: T;
}

type MetadataRecord = Record<string, unknown>;
type CollectionRecord = CollectionMetadata & { slug: string };
type ContentFiles = Record<string, MarkdownModule<MetadataRecord>>;

interface LoadedContent<T> {
	records: T[];
	components: Record<string, Component>;
	slugsByFile: Record<string, string>;
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

function optionalPercentage(
	metadata: MetadataRecord,
	field: string,
	source: string
): number | undefined {
	const value = metadata[field];
	if (value === undefined) return undefined;
	if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) {
		throw new Error(`Invalid "${field}" in ${source}; expected a number from 0 to 100`);
	}
	return value;
}

function optionalPositiveNumber(
	metadata: MetadataRecord,
	field: string,
	source: string
): number | undefined {
	const value = metadata[field];
	if (value === undefined) return undefined;
	if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
		throw new Error(`Invalid "${field}" in ${source}; expected a positive number`);
	}
	return value;
}

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function optionalIsoDate(
	metadata: MetadataRecord,
	field: string,
	source: string
): string | undefined {
	const value = optionalString(metadata, field, source);
	if (value === undefined) return undefined;
	const match = value.match(ISO_DATE_PATTERN);
	if (!match) {
		throw new Error(`Invalid "${field}" in ${source}; expected YYYY-MM-DD`);
	}
	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const parsed = new Date(Date.UTC(year, month - 1, day));
	if (
		parsed.getUTCFullYear() !== year ||
		parsed.getUTCMonth() !== month - 1 ||
		parsed.getUTCDate() !== day
	) {
		throw new Error(`Invalid calendar date "${field}" in ${source}`);
	}
	return value;
}

const BLOG_DATE_FORMATTER = new Intl.DateTimeFormat('en-GB', {
	day: 'numeric',
	month: 'long',
	year: 'numeric',
	timeZone: 'UTC'
});

export function formatIsoDate(isoDate: string): string {
	const match = isoDate.match(ISO_DATE_PATTERN);
	if (!match) return isoDate;
	const parsed = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
	return BLOG_DATE_FORMATTER.format(parsed);
}

function stringList(metadata: MetadataRecord, field: string, source: string): string[] {
	const value = metadata[field];
	if (value === undefined) return [];
	if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
		throw new Error(`Invalid "${field}" in ${source}`);
	}
	return value;
}

function optionalStringList(
	metadata: MetadataRecord,
	field: string,
	source: string
): string[] | undefined {
	const value = metadata[field];
	if (value === undefined) return undefined;
	if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !item.trim())) {
		throw new Error(`Invalid "${field}" in ${source}; expected a list of non-empty strings`);
	}
	return value;
}

function academicYears(
	metadata: MetadataRecord,
	source: string
): AcademicYearDetails[] | undefined {
	const value = metadata.academicYears;
	if (value === undefined) return undefined;
	if (!Array.isArray(value)) {
		throw new Error(`Invalid "academicYears" in ${source}`);
	}

	return value.map((item, index) => {
		if (!item || typeof item !== 'object' || Array.isArray(item)) {
			throw new Error(`Invalid "academicYears[${index}]" in ${source}`);
		}
		const year = item as MetadataRecord;
		if (year.ongoing !== undefined && typeof year.ongoing !== 'boolean') {
			throw new Error(`Invalid "academicYears[${index}].ongoing" in ${source}`);
		}
		return {
			year: requireString(year, 'year', source),
			awards: stringList(year, 'awards', source),
			ongoing: year.ongoing ?? false
		};
	});
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
		updatedAt: optionalString(metadata, 'updatedAt', source),
		related: optionalStringList(metadata, 'related', source)
	};
}

function loadContent<T extends { slug: string }>(
	files: ContentFiles,
	createRecord: (slug: string, metadata: MetadataRecord, source: string) => T,
	sort: (left: T, right: T) => number
): LoadedContent<T> {
	const records: T[] = [];
	const components: Record<string, Component> = {};
	const slugsByFile: Record<string, string> = {};

	for (const [source, file] of Object.entries(files)) {
		const slug = slugFromPath(source);
		if (components[slug]) {
			throw new Error(`Duplicate content slug: ${slug}`);
		}
		const record = createRecord(slug, file.metadata, source);
		records.push(record);
		components[slug] = file.default;
		slugsByFile[source.split('/').at(-1)!] = record.slug;
	}

	records.sort(sort);
	return { records, components, slugsByFile };
}

const byOrderThen = <T extends { order?: number }>(
	label: (record: T) => string
): ((left: T, right: T) => number) => {
	return (left, right) =>
		(left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER) ||
		label(left).localeCompare(label(right), 'en-GB');
};

const pageDocuments = loadContent(
	import.meta.glob<MarkdownModule<MetadataRecord>>('../content/pages/*.md', { eager: true }),
	(slug, metadata, source): PageIntroduction => ({
		slug,
		path: requireString(metadata, 'path', source),
		title: requireString(metadata, 'title', source),
		description: requireString(metadata, 'description', source),
		introduction: optionalString(metadata, 'introduction', source),
		academicYears: academicYears(metadata, source),
		related: optionalStringList(metadata, 'related', source)
	}),
	(left, right) => left.slug.localeCompare(right.slug, 'en-GB')
);

export const pageIntroductions = Object.fromEntries(
	pageDocuments.records.map((page) => [page.slug, page])
) as Record<string, PageIntroduction>;
export const pageContent = pageDocuments.components;

const projectDocuments = loadContent(
	import.meta.glob<MarkdownModule<MetadataRecord>>('../content/projects/*.md', { eager: true }),
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
	import.meta.glob<MarkdownModule<MetadataRecord>>('../content/experience/*.md', {
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
	import.meta.glob<MarkdownModule<MetadataRecord>>('../content/modules/*.md', { eager: true }),
	(_slug, metadata, source): AcademicModule => ({
		slug: requireString(metadata, 'code', source).toLocaleLowerCase('en-GB'),
		code: requireString(metadata, 'code', source),
		title: requireString(metadata, 'title', source),
		year: requireString(metadata, 'year', source),
		semester: optionalString(metadata, 'semester', source),
		mark: optionalPercentage(metadata, 'mark', source),
		credits: optionalPositiveNumber(metadata, 'credits', source) ?? 15,
		summary: requireString(metadata, 'summary', source),
		skills: stringList(metadata, 'skills', source),
		technologies: stringList(metadata, 'technologies', source),
		...collectionMetadata(metadata, source)
	}),
	byOrderThen((module) => module.code)
);
export const modules = moduleDocuments.records;
export const moduleContent = moduleDocuments.components;
export const moduleSlugsByFile = moduleDocuments.slugsByFile;

const blogDocuments = loadContent(
	import.meta.glob<MarkdownModule<MetadataRecord>>('../content/blog/*.md', { eager: true }),
	(slug, metadata, source): BlogPost => {
		const meta = collectionMetadata(metadata, source);
		const publishedAt = optionalIsoDate(metadata, 'publishedAt', source);
		if (meta.status === 'published' && !publishedAt) {
			throw new Error(`Missing "publishedAt" on published blog post in ${source}`);
		}
		return {
			slug,
			title: requireString(metadata, 'title', source),
			summary: requireString(metadata, 'summary', source),
			publishedAt,
			topics: stringList(metadata, 'topics', source),
			...meta
		};
	},
	(left, right) =>
		(right.publishedAt ?? '').localeCompare(left.publishedAt ?? '') ||
		byOrderThen<BlogPost>((post) => post.title)(left, right)
);
export const blogPosts = blogDocuments.records;
export const blogContent = blogDocuments.components;

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
export const visibleModules = (includeDrafts = false): AcademicModule[] =>
	visible(modules, includeDrafts);
export const visibleProjects = (includeDrafts = false): Project[] =>
	visible(projects, includeDrafts);
export const visibleBlogPosts = (includeDrafts = false): BlogPost[] =>
	visible(blogPosts, includeDrafts);
export const hasPublishedBlogPosts = (): boolean => visibleBlogPosts(false).length > 0;

export const featuredProjects = (includeDrafts = false): Project[] =>
	visibleProjects(includeDrafts).filter((project) => project.featured);

export function findModule(code: string, includeDrafts = false): AcademicModule | undefined {
	return visibleModules(includeDrafts).find(
		(module) => module.code.toLocaleLowerCase('en-GB') === code.toLocaleLowerCase('en-GB')
	);
}

export const findProject = (slug: string, includeDrafts = false): Project | undefined =>
	visibleProjects(includeDrafts).find((project) => project.slug === slug);
export const findExperience = (slug: string, includeDrafts = false): Experience | undefined =>
	visibleExperience(includeDrafts).find((entry) => entry.slug === slug);
export const findBlogPost = (slug: string, includeDrafts = false): BlogPost | undefined =>
	visibleBlogPosts(includeDrafts).find((post) => post.slug === slug);
