import {
	experience,
	featuredProjects,
	modules,
	pageIntroductions,
	projects,
	visibleProjects,
	type PublicationStatus
} from './content';

export type ContentKind = 'page' | 'project' | 'experience' | 'module';

export interface ContentLink {
	path: string;
	slug: string;
	kind: ContentKind;
	title: string;
	summary: string;
	status: PublicationStatus;
}

export interface PageConnectionsData {
	related: ContentLink[];
	mentionedBy: ContentLink[];
}

export interface BrokenInternalLink {
	sourcePath: string;
	target: string;
	reason: 'unknown' | 'self' | 'draft-target';
}

interface ContentNode extends ContentLink {
	relatedPaths: string[];
}

const KNOWN_NON_MAIN_ROUTES = new Set(['/silly', '/silly/legacy', '/silly/who-is-ramis-bhatty']);
const STATIC_ASSET_PREFIXES = ['/documents/', '/images/'];

const KIND_ORDER: Record<ContentKind, number> = {
	project: 0,
	experience: 1,
	module: 2,
	page: 3
};

const STANDALONE_PAGE_PATHS: Record<string, string> = {
	home: '/',
	cv: '/cv',
	education: '/education',
	'go2-poster': '/work/go2-lidar-perception/poster'
};

// Embedded education markdown fragments render inside /education rather than at their own URLs.
const EMBEDDED_PAGE_SOURCES: Record<string, string> = {
	'education-school': '/education',
	'education-a-levels': '/education',
	'education-gcses': '/education'
};

const NON_MAIN_PAGE_SLUGS = new Set(['who-is-ramis-bhatty']);

export function normalizeInternalPath(rawTarget: string): string | undefined {
	const trimmed = rawTarget.trim();
	if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//') || !trimmed.startsWith('/')) {
		return undefined;
	}

	const withoutFragment = trimmed.split('#', 1)[0];
	const withoutQuery = withoutFragment.split('?', 1)[0];
	const lowercased = withoutQuery.toLocaleLowerCase('en-GB');
	if (lowercased === '/') return '/';

	const normalized = lowercased.replace(/\/+$/, '');
	return normalized || '/';
}

function stripCodeBlocksAndSpans(markdown: string): string {
	const lines = markdown.split(/\r?\n/);
	const kept: string[] = [];
	let fenceChar: '`' | '~' | null = null;
	let fenceLength = 0;

	for (const line of lines) {
		const fenceMatch = line.match(/^[ \t]{0,3}(`{3,}|~{3,})(.*)$/);
		if (fenceMatch) {
			const marker = fenceMatch[1];
			const char = marker[0] as '`' | '~';
			const rest = fenceMatch[2];
			if (!fenceChar) {
				if (char === '~' || !rest.includes('`')) {
					fenceChar = char;
					fenceLength = marker.length;
					continue;
				}
			} else if (char === fenceChar && marker.length >= fenceLength && !rest.trim()) {
				fenceChar = null;
				fenceLength = 0;
				continue;
			}
		}

		if (!fenceChar) {
			kept.push(line);
		}
	}

	const withoutFences = kept.join('\n');
	// Remove inline code spans (matching opening and closing backtick runs of equal length).
	let result = '';
	let index = 0;
	while (index < withoutFences.length) {
		if (withoutFences[index] !== '`') {
			result += withoutFences[index];
			index += 1;
			continue;
		}

		let tickCount = 0;
		while (withoutFences[index + tickCount] === '`') {
			tickCount += 1;
		}
		const closer = '`'.repeat(tickCount);
		let searchFrom = index + tickCount;
		let closeIndex = -1;
		while (searchFrom < withoutFences.length) {
			const candidate = withoutFences.indexOf(closer, searchFrom);
			if (candidate === -1) break;
			const beforeOk = candidate === 0 || withoutFences[candidate - 1] !== '`';
			const afterOk =
				candidate + tickCount >= withoutFences.length ||
				withoutFences[candidate + tickCount] !== '`';
			if (beforeOk && afterOk) {
				closeIndex = candidate;
				break;
			}
			searchFrom = candidate + 1;
		}

		if (closeIndex !== -1) {
			index = closeIndex + tickCount;
		} else {
			result += closer;
			index += tickCount;
		}
	}

	return result;
}

export function extractMarkdownInternalLinks(rawMarkdown: string): string[] {
	const withoutFrontmatter = rawMarkdown.replace(/^---\r?\n(?:[\s\S]*?\r?\n)?---(?:\r?\n|$)/, '');
	const body = stripCodeBlocksAndSpans(withoutFrontmatter);

	const candidates: { index: number; target: string }[] = [];

	const inlineLinkPattern = /(?<!!)\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+["'][^"']*["'])?\s*\)/g;
	for (const match of body.matchAll(inlineLinkPattern)) {
		if (match[1]) candidates.push({ index: match.index ?? 0, target: match[1] });
	}

	const referenceDefPattern = /^[ \t]{0,3}\[[^\]]+\]:[ \t]*<?([^\s>]+)>?/gm;
	for (const match of body.matchAll(referenceDefPattern)) {
		if (match[1]) candidates.push({ index: match.index ?? 0, target: match[1] });
	}

	const htmlAnchorPattern = /<a\b[^>]*\bhref\s*=\s*(?:"([^"]+)"|'([^']+)')/gi;
	for (const match of body.matchAll(htmlAnchorPattern)) {
		const href = match[1] ?? match[2];
		if (href) candidates.push({ index: match.index ?? 0, target: href });
	}

	candidates.sort((left, right) => left.index - right.index);

	const seen = new Set<string>();
	const normalizedLinks: string[] = [];
	for (const candidate of candidates) {
		const normalized = normalizeInternalPath(candidate.target);
		if (normalized && !seen.has(normalized)) {
			seen.add(normalized);
			normalizedLinks.push(normalized);
		}
	}

	return normalizedLinks;
}

function slugFromPath(path: string): string {
	const filename = path.split('/').at(-1);
	if (!filename?.endsWith('.md')) {
		throw new Error(`Unable to derive a content slug from "${path}"`);
	}
	return filename.slice(0, -3);
}

function toContentLink(node: ContentNode): ContentLink {
	return {
		path: node.path,
		slug: node.slug,
		kind: node.kind,
		title: node.title,
		summary: node.summary,
		status: node.status
	};
}

const nodes: ContentNode[] = [];

for (const [slug, path] of Object.entries(STANDALONE_PAGE_PATHS)) {
	const page = pageIntroductions[slug];
	if (!page) {
		throw new Error(`Missing required page "${slug}" for link registry`);
	}
	nodes.push({
		path,
		slug,
		kind: 'page',
		title: slug === 'home' ? 'Home' : page.title,
		summary: page.description,
		status: 'published',
		relatedPaths: (page.related ?? []).map((entry) => entry)
	});
}

for (const project of projects) {
	nodes.push({
		path: `/work/${project.slug}`,
		slug: project.slug,
		kind: 'project',
		title: project.title,
		summary: project.summary,
		status: project.status,
		relatedPaths: (project.related ?? []).map((entry) => entry)
	});
}

for (const entry of experience) {
	nodes.push({
		path: `/work/experience/${entry.slug}`,
		slug: entry.slug,
		kind: 'experience',
		title: `${entry.role}, ${entry.organisation}`,
		summary: entry.summary,
		status: entry.status,
		relatedPaths: (entry.related ?? []).map((item) => item)
	});
}

for (const module of modules) {
	nodes.push({
		path: `/education/${module.slug}`,
		slug: module.slug,
		kind: 'module',
		title: `${module.code}: ${module.title}`,
		summary: module.summary,
		status: module.status,
		relatedPaths: (module.related ?? []).map((item) => item)
	});
}

const nodesByPath = new Map<string, ContentNode>(nodes.map((node) => [node.path, node]));

for (const node of nodes) {
	const normalizedRelated: string[] = [];
	for (const rawTarget of node.relatedPaths) {
		const normalized = normalizeInternalPath(rawTarget);
		if (!normalized || !nodesByPath.has(normalized)) {
			throw new Error(`"${node.path}" references unknown related path "${rawTarget}"`);
		}
		if (normalized === node.path) {
			throw new Error(`"${node.path}" cannot reference itself in "related"`);
		}
		if (!normalizedRelated.includes(normalized)) {
			normalizedRelated.push(normalized);
		}
	}
	node.relatedPaths = normalizedRelated;
}

const rawPages = import.meta.glob<string>('../content/pages/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
});
const rawProjects = import.meta.glob<string>('../content/projects/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
});
const rawExperience = import.meta.glob<string>('../content/experience/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
});
const rawModules = import.meta.glob<string>('../content/modules/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
});

const proseOutgoing = new Map<string, string[]>();

function recordProseLinks(sourcePath: string, rawMarkdown: string): void {
	const extracted = extractMarkdownInternalLinks(rawMarkdown);
	const existing = proseOutgoing.get(sourcePath) ?? [];
	for (const target of extracted) {
		if (!existing.includes(target)) {
			existing.push(target);
		}
	}
	proseOutgoing.set(sourcePath, existing);
}

for (const [source, rawMarkdown] of Object.entries(rawPages)) {
	const slug = slugFromPath(source);
	if (NON_MAIN_PAGE_SLUGS.has(slug)) continue;
	const sourcePath = STANDALONE_PAGE_PATHS[slug] ?? EMBEDDED_PAGE_SOURCES[slug];
	if (!sourcePath) {
		throw new Error(`Unmapped page Markdown source "${source}" in link registry`);
	}
	recordProseLinks(sourcePath, rawMarkdown);
}

for (const [source, rawMarkdown] of Object.entries(rawProjects)) {
	const slug = slugFromPath(source);
	recordProseLinks(`/work/${slug}`, rawMarkdown);
}

for (const [source, rawMarkdown] of Object.entries(rawExperience)) {
	const slug = slugFromPath(source);
	recordProseLinks(`/work/experience/${slug}`, rawMarkdown);
}

for (const [source, rawMarkdown] of Object.entries(rawModules)) {
	const slug = slugFromPath(source).toLocaleLowerCase('en-GB');
	recordProseLinks(`/education/${slug}`, rawMarkdown);
}

function getHomeProjectLinks(includeDrafts: boolean): string[] {
	const visible = visibleProjects(includeDrafts);
	const selected = featuredProjects(includeDrafts);
	const homeProjects = (selected.length ? selected : visible).slice(0, 3);
	return homeProjects.map((project) => `/work/${project.slug}`);
}

export function getPageConnections(
	targetPath: string,
	options?: { includeDrafts?: boolean; excludeMentionedBy?: string[] }
): PageConnectionsData {
	const includeDrafts = options?.includeDrafts ?? false;
	const normalizedTarget = normalizeInternalPath(targetPath) ?? targetPath;
	const targetNode = nodesByPath.get(normalizedTarget);

	const related: ContentLink[] = [];
	const relatedPathSet = new Set<string>();

	if (targetNode) {
		for (const relatedPath of targetNode.relatedPaths) {
			const relatedNode = nodesByPath.get(relatedPath);
			if (!relatedNode) continue;
			if (!includeDrafts && relatedNode.status !== 'published') continue;
			if (!relatedPathSet.has(relatedPath)) {
				relatedPathSet.add(relatedPath);
				related.push(toContentLink(relatedNode));
			}
		}
	}

	const excluded = new Set<string>([normalizedTarget, ...relatedPathSet]);
	for (const rawExcluded of options?.excludeMentionedBy ?? []) {
		const normalizedExcluded = normalizeInternalPath(rawExcluded);
		if (normalizedExcluded) excluded.add(normalizedExcluded);
	}

	const homeProjectLinks = getHomeProjectLinks(includeDrafts);
	const mentionedBy: ContentLink[] = [];

	for (const sourceNode of nodes) {
		if (!includeDrafts && sourceNode.status !== 'published') continue;
		if (excluded.has(sourceNode.path)) continue;

		const outgoing = proseOutgoing.get(sourceNode.path) ?? [];
		const linksToTarget =
			outgoing.includes(normalizedTarget) ||
			(sourceNode.path === '/' && homeProjectLinks.includes(normalizedTarget));

		if (linksToTarget) {
			mentionedBy.push(toContentLink(sourceNode));
		}
	}

	mentionedBy.sort(
		(left, right) =>
			KIND_ORDER[left.kind] - KIND_ORDER[right.kind] ||
			left.title.localeCompare(right.title, 'en-GB')
	);

	return { related, mentionedBy };
}

function isStaticAssetTarget(path: string): boolean {
	return STATIC_ASSET_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export function findBrokenInternalLinks(options?: {
	checkDraftLeaks?: boolean;
}): BrokenInternalLink[] {
	const checkDraftLeaks = options?.checkDraftLeaks ?? true;
	const issues: BrokenInternalLink[] = [];

	for (const [sourcePath, targets] of proseOutgoing.entries()) {
		const sourceNode = nodesByPath.get(sourcePath);
		for (const target of targets) {
			if (target === sourcePath) continue;

			const targetNode = nodesByPath.get(target);
			if (!targetNode && !KNOWN_NON_MAIN_ROUTES.has(target) && !isStaticAssetTarget(target)) {
				issues.push({ sourcePath, target, reason: 'unknown' });
				continue;
			}

			if (checkDraftLeaks && sourceNode?.status === 'published' && targetNode?.status === 'draft') {
				issues.push({ sourcePath, target, reason: 'draft-target' });
			}
		}
	}

	if (checkDraftLeaks) {
		for (const sourceNode of nodes) {
			if (sourceNode.status !== 'published') continue;
			for (const relatedPath of sourceNode.relatedPaths) {
				const targetNode = nodesByPath.get(relatedPath);
				if (targetNode?.status === 'draft') {
					issues.push({
						sourcePath: sourceNode.path,
						target: relatedPath,
						reason: 'draft-target'
					});
				}
			}
		}
	}

	return issues;
}
