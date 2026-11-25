import {
	blogPosts,
	experience,
	featuredProjects,
	hasPublishedBlogPosts,
	modules,
	moduleSlugsByFile,
	pageIntroductions,
	projects,
	visibleProjects,
	type PublicationStatus
} from './content';
import { site } from './data/config';

export type ContentKind = 'page' | 'project' | 'experience' | 'blog' | 'module';
export type MainPageSlug = 'home' | 'cv' | 'education' | 'blog' | 'go2-poster';

interface ContentLinkBase {
	path: string;
	title: string;
	summary: string;
	status: PublicationStatus;
}

export type ContentLink =
	| (ContentLinkBase & { kind: 'page'; slug: MainPageSlug })
	| (ContentLinkBase & { kind: 'project' | 'experience' | 'blog' | 'module'; slug: string });

export type ContentGraphNodeInput = ContentLink & {
	related?: string[];
};

export interface PageConnectionsData {
	related: ContentLink[];
	mentionedBy: ContentLink[];
}

export interface BrokenInternalLink {
	sourcePath: string;
	target: string;
	reason: 'unknown' | 'self' | 'draft-target' | 'absolute-self-url';
}

export interface StaticAssetReference {
	sourcePath: string;
	target: string;
}

export interface ContentLinkGraphInput {
	nodes: ContentGraphNodeInput[];
	markdownSources: {
		sourcePath: string;
		rawMarkdown: string;
	}[];
	getHomeProjectPaths: (includeDrafts: boolean) => string[];
}

interface ContentNodeBase extends ContentLinkBase {
	relatedPaths: string[];
}

type ContentNode =
	| (ContentNodeBase & { kind: 'page'; slug: MainPageSlug })
	| (ContentNodeBase & { kind: 'project' | 'experience' | 'blog' | 'module'; slug: string });

const KNOWN_NON_MAIN_ROUTES = new Set(['/silly', '/silly/legacy', '/silly/who-is-ramis-bhatty']);
const STATIC_ASSET_PREFIXES = ['/documents/', '/images/'];

const KIND_ORDER: Record<ContentKind, number> = {
	project: 0,
	experience: 1,
	blog: 2,
	module: 3,
	page: 4
};

const STANDALONE_PAGE_PATHS: Record<MainPageSlug, string> = {
	home: '/',
	cv: '/cv',
	education: '/education',
	blog: '/blog',
	'go2-poster': '/work/go2-lidar-perception/poster'
};

// Embedded education markdown fragments render inside /education rather than at their own URLs.
const EMBEDDED_PAGE_SOURCES: Record<string, string> = {
	'education-school': '/education',
	'education-a-levels': '/education',
	'education-gcses': '/education'
};

const NON_MAIN_PAGE_SLUGS = new Set(['who-is-ramis-bhatty']);

const SITE_ORIGIN_HOST = new URL(site.origin).hostname.toLocaleLowerCase('en-GB');
const SELF_ORIGIN_HOSTS = new Set([SITE_ORIGIN_HOST, `www.${SITE_ORIGIN_HOST}`]);

export function isSelfOriginUrl(rawTarget: string): boolean {
	const trimmed = rawTarget.trim();
	if (!/^https?:\/\//i.test(trimmed)) return false;
	try {
		const parsed = new URL(trimmed);
		return SELF_ORIGIN_HOSTS.has(parsed.hostname.toLocaleLowerCase('en-GB'));
	} catch {
		return false;
	}
}

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

function stripFencedAndIndentedCode(markdown: string): string {
	const lines = markdown.split(/\r?\n/);
	const kept: string[] = [];
	let fenceChar: '`' | '~' | null = null;
	let fenceLength = 0;
	let inIndentedCode = false;
	let prevBlank = true;
	let prevWasList = false;

	for (const line of lines) {
		const fenceMatch = line.match(/^[ \t]{0,3}(`{3,}|~{3,})(.*)$/);
		if (fenceMatch) {
			const marker = fenceMatch[1];
			const char = marker[0] as '`' | '~';
			const rest = fenceMatch[2];
			if (!fenceChar && !inIndentedCode) {
				if (char === '~' || !rest.includes('`')) {
					fenceChar = char;
					fenceLength = marker.length;
					prevBlank = false;
					continue;
				}
			} else if (fenceChar && char === fenceChar && marker.length >= fenceLength && !rest.trim()) {
				fenceChar = null;
				fenceLength = 0;
				prevBlank = false;
				prevWasList = false;
				continue;
			}
		}

		if (fenceChar) continue;

		const isBlank = !/\S/.test(line);
		const isIndented4 = /^(?: {4}|\t)/.test(line);

		if (inIndentedCode) {
			if (isBlank) {
				prevBlank = true;
				continue;
			}
			if (isIndented4) {
				prevBlank = false;
				continue;
			}
			inIndentedCode = false;
		}

		const isListMarker = /^\s*(?:[-+*]|\d{1,9}[.)])(?:\s|$)/.test(line);
		// CommonMark indented code blocks only begin after a blank line (or start) and outside list continuations.
		if (prevBlank && isIndented4 && !prevWasList && !isListMarker) {
			inIndentedCode = true;
			prevBlank = false;
			continue;
		}

		kept.push(line);
		prevBlank = isBlank;
		if (!isBlank) {
			if (isListMarker) {
				prevWasList = true;
			} else if (!isIndented4 && !/^\s{1,3}\S/.test(line)) {
				prevWasList = false;
			}
		}
	}

	return kept.join('\n');
}

function stripInlineCodeSpans(markdown: string): string {
	let result = '';
	let index = 0;
	while (index < markdown.length) {
		if (markdown[index] !== '`') {
			result += markdown[index];
			index += 1;
			continue;
		}

		let tickCount = 0;
		while (markdown[index + tickCount] === '`') {
			tickCount += 1;
		}
		const closer = '`'.repeat(tickCount);
		let searchFrom = index + tickCount;
		let closeIndex = -1;
		while (searchFrom < markdown.length) {
			const candidate = markdown.indexOf(closer, searchFrom);
			if (candidate === -1) break;
			const beforeOk = candidate === 0 || markdown[candidate - 1] !== '`';
			const afterOk =
				candidate + tickCount >= markdown.length || markdown[candidate + tickCount] !== '`';
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

function stripNonLinkMarkdown(rawMarkdown: string): string {
	const withoutFrontmatter = rawMarkdown.replace(/^---\r?\n(?:[\s\S]*?\r?\n)?---(?:\r?\n|$)/, '');
	const withoutBlocks = stripFencedAndIndentedCode(withoutFrontmatter);
	const withoutComments = withoutBlocks.replace(/<!--[\s\S]*?-->/g, '');
	return stripInlineCodeSpans(withoutComments);
}

function isEscaped(text: string, index: number): boolean {
	let backslashes = 0;
	for (let cursor = index - 1; cursor >= 0 && text[cursor] === '\\'; cursor -= 1) {
		backslashes += 1;
	}
	return backslashes % 2 === 1;
}

function findMatchingBracket(text: string, openIndex: number): number {
	let depth = 0;
	for (let index = openIndex; index < text.length; index += 1) {
		if (text[index] === '\\') {
			index += 1;
			continue;
		}
		if (text[index] === '[') {
			depth += 1;
		} else if (text[index] === ']') {
			depth -= 1;
			if (depth === 0) return index;
		}
	}
	return -1;
}

function skipWhitespace(text: string, start: number): number {
	let index = start;
	while (index < text.length && /[ \t\r\n]/.test(text[index])) {
		index += 1;
	}
	return index;
}

function skipLinkTitle(text: string, start: number): number {
	const quote = text[start];
	const closer = quote === '(' ? ')' : quote;
	for (let index = start + 1; index < text.length; index += 1) {
		if (text[index] === '\\') {
			index += 1;
			continue;
		}
		if (text[index] === closer) {
			return index + 1;
		}
	}
	return -1;
}

function parseInlineDestination(
	text: string,
	openParenIndex: number
): { target: string; closeParenIndex: number } | undefined {
	let index = skipWhitespace(text, openParenIndex + 1);
	if (index >= text.length) return undefined;

	let target = '';
	if (text[index] === '<') {
		index += 1;
		const start = index;
		while (
			index < text.length &&
			text[index] !== '>' &&
			text[index] !== '\n' &&
			text[index] !== '\r'
		) {
			if (text[index] === '\\') {
				index += 1;
			}
			index += 1;
		}
		if (index >= text.length || text[index] !== '>') return undefined;
		target = text.slice(start, index).replace(/\\(.)/g, '$1');
		index += 1;
	} else {
		let parenDepth = 0;
		while (index < text.length) {
			const char = text[index];
			if (char === '\\' && index + 1 < text.length) {
				target += text[index + 1];
				index += 2;
				continue;
			}
			if (char === '(') {
				parenDepth += 1;
				target += char;
				index += 1;
				continue;
			}
			if (char === ')') {
				if (parenDepth === 0) break;
				parenDepth -= 1;
				target += char;
				index += 1;
				continue;
			}
			if (/[ \t\r\n]/.test(char)) break;
			target += char;
			index += 1;
		}
	}

	if (!target) return undefined;

	index = skipWhitespace(text, index);
	if (index < text.length && (text[index] === '"' || text[index] === "'" || text[index] === '(')) {
		const afterTitle = skipLinkTitle(text, index);
		if (afterTitle === -1) return undefined;
		index = skipWhitespace(text, afterTitle);
	}

	if (text[index] !== ')') return undefined;
	return { target, closeParenIndex: index };
}

interface ScannedTarget {
	index: number;
	kind: 'link' | 'image';
	target: string;
}

function scanMarkdownInlineItems(body: string, offset = 0, imagesOnly = false): ScannedTarget[] {
	const results: ScannedTarget[] = [];

	for (let index = 0; index < body.length; index += 1) {
		if (body[index] === '\\') {
			index += 1;
			continue;
		}
		if (body[index] !== '[') continue;

		const isImage = index > 0 && body[index - 1] === '!' && !isEscaped(body, index - 1);
		const closeBracket = findMatchingBracket(body, index);
		if (closeBracket === -1) continue;

		if (body[closeBracket + 1] !== '(') continue;
		const parsed = parseInlineDestination(body, closeBracket + 1);
		if (!parsed) continue;

		if (!imagesOnly || isImage) {
			results.push({
				index: offset + (isImage ? index - 1 : index),
				kind: isImage ? 'image' : 'link',
				target: parsed.target
			});
		}

		// Scan inside link text for nested images (such as linked SVG figures).
		if (!isImage) {
			const inner = body.slice(index + 1, closeBracket);
			results.push(...scanMarkdownInlineItems(inner, offset + index + 1, true));
		}

		index = parsed.closeParenIndex;
	}

	return results;
}

function extractRawLinkTargets(rawMarkdown: string): string[] {
	const body = stripNonLinkMarkdown(rawMarkdown);
	const candidates: { index: number; target: string }[] = [];

	for (const item of scanMarkdownInlineItems(body)) {
		if (item.kind === 'link') {
			candidates.push({ index: item.index, target: item.target });
		}
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
	return candidates.map((candidate) => candidate.target);
}

export function extractMarkdownInternalLinks(rawMarkdown: string): string[] {
	const seen = new Set<string>();
	const normalizedLinks: string[] = [];

	for (const rawTarget of extractRawLinkTargets(rawMarkdown)) {
		const normalized = normalizeInternalPath(rawTarget);
		if (normalized && !seen.has(normalized)) {
			seen.add(normalized);
			normalizedLinks.push(normalized);
		}
	}

	return normalizedLinks;
}

export function extractMarkdownSelfOriginLinks(rawMarkdown: string): string[] {
	const seen = new Set<string>();
	const selfOriginLinks: string[] = [];

	for (const rawTarget of extractRawLinkTargets(rawMarkdown)) {
		const trimmed = rawTarget.trim();
		if (isSelfOriginUrl(trimmed) && !seen.has(trimmed)) {
			seen.add(trimmed);
			selfOriginLinks.push(trimmed);
		}
	}

	return selfOriginLinks;
}

export function extractMarkdownStaticAssets(
	rawMarkdown: string,
	prefixes: readonly string[] = STATIC_ASSET_PREFIXES
): string[] {
	const body = stripNonLinkMarkdown(rawMarkdown);
	const candidates: { index: number; target: string }[] = [];

	for (const item of scanMarkdownInlineItems(body)) {
		candidates.push({ index: item.index, target: item.target });
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

	const htmlImagePattern = /<img\b[^>]*\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)')/gi;
	for (const match of body.matchAll(htmlImagePattern)) {
		const src = match[1] ?? match[2];
		if (src) candidates.push({ index: match.index ?? 0, target: src });
	}

	candidates.sort((left, right) => left.index - right.index);

	const seen = new Set<string>();
	const assets: string[] = [];
	for (const candidate of candidates) {
		const normalized = normalizeInternalPath(candidate.target);
		if (
			normalized &&
			prefixes.some((prefix) => normalized.startsWith(prefix)) &&
			!seen.has(normalized)
		) {
			seen.add(normalized);
			assets.push(normalized);
		}
	}

	return assets;
}

function toContentLink(node: ContentNode): ContentLink {
	if (node.kind === 'page') {
		return {
			path: node.path,
			slug: node.slug,
			kind: 'page',
			title: node.title,
			summary: node.summary,
			status: node.status
		};
	}

	return {
		path: node.path,
		slug: node.slug,
		kind: node.kind,
		title: node.title,
		summary: node.summary,
		status: node.status
	};
}

function compareContentNodes(left: ContentNode, right: ContentNode): number {
	return (
		KIND_ORDER[left.kind] - KIND_ORDER[right.kind] || left.title.localeCompare(right.title, 'en-GB')
	);
}

function isStaticAssetTarget(path: string): boolean {
	return STATIC_ASSET_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export function createContentLinkGraph(input: ContentLinkGraphInput) {
	const nodes: ContentNode[] = [];
	const nodesByPath = new Map<string, ContentNode>();

	for (const item of input.nodes) {
		if (nodesByPath.has(item.path)) {
			throw new Error(`Duplicate content node path: "${item.path}"`);
		}
		const base: ContentNodeBase = {
			path: item.path,
			title: item.title,
			summary: item.summary,
			status: item.status,
			relatedPaths: [...(item.related ?? [])]
		};
		const node: ContentNode =
			item.kind === 'page'
				? { ...base, kind: 'page', slug: item.slug }
				: { ...base, kind: item.kind, slug: item.slug };
		nodes.push(node);
		nodesByPath.set(node.path, node);
	}

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

	const proseOutgoing = new Map<string, string[]>();
	const selfOriginOutgoing = new Map<string, string[]>();
	const staticAssetsBySource = new Map<string, string[]>();

	for (const { sourcePath, rawMarkdown } of input.markdownSources) {
		if (!nodesByPath.has(sourcePath)) {
			throw new Error(`Unmapped markdown source path "${sourcePath}" in link graph`);
		}

		const outgoing = proseOutgoing.get(sourcePath) ?? [];
		for (const target of extractMarkdownInternalLinks(rawMarkdown)) {
			if (!outgoing.includes(target)) outgoing.push(target);
		}
		proseOutgoing.set(sourcePath, outgoing);

		const selfOrigin = selfOriginOutgoing.get(sourcePath) ?? [];
		for (const url of extractMarkdownSelfOriginLinks(rawMarkdown)) {
			if (!selfOrigin.includes(url)) selfOrigin.push(url);
		}
		selfOriginOutgoing.set(sourcePath, selfOrigin);

		const assets = staticAssetsBySource.get(sourcePath) ?? [];
		for (const asset of extractMarkdownStaticAssets(rawMarkdown)) {
			if (!assets.includes(asset)) assets.push(asset);
		}
		staticAssetsBySource.set(sourcePath, assets);
	}

	const proseBacklinksByTarget = new Map<string, ContentNode[]>();
	for (const sourceNode of nodes) {
		for (const target of proseOutgoing.get(sourceNode.path) ?? []) {
			if (target === sourceNode.path) continue;
			const list = proseBacklinksByTarget.get(target) ?? [];
			if (!list.includes(sourceNode)) {
				list.push(sourceNode);
			}
			proseBacklinksByTarget.set(target, list);
		}
	}
	for (const list of proseBacklinksByTarget.values()) {
		list.sort(compareContentNodes);
	}

	const homeNode = nodesByPath.get('/');

	function getPageConnections(
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

		const backlinkCandidates = [...(proseBacklinksByTarget.get(normalizedTarget) ?? [])];
		const homeProjectPaths = input.getHomeProjectPaths(includeDrafts);
		if (
			homeNode &&
			homeProjectPaths.includes(normalizedTarget) &&
			!backlinkCandidates.includes(homeNode)
		) {
			backlinkCandidates.push(homeNode);
			backlinkCandidates.sort(compareContentNodes);
		}

		const mentionedBy: ContentLink[] = [];
		for (const sourceNode of backlinkCandidates) {
			if (!includeDrafts && sourceNode.status !== 'published') continue;
			if (excluded.has(sourceNode.path)) continue;
			mentionedBy.push(toContentLink(sourceNode));
		}

		return { related, mentionedBy };
	}

	function findBrokenInternalLinks(options?: { checkDraftLeaks?: boolean }): BrokenInternalLink[] {
		const checkDraftLeaks = options?.checkDraftLeaks ?? true;
		const issues: BrokenInternalLink[] = [];

		for (const [sourcePath, urls] of selfOriginOutgoing.entries()) {
			for (const url of urls) {
				issues.push({ sourcePath, target: url, reason: 'absolute-self-url' });
			}
		}

		for (const [sourcePath, targets] of proseOutgoing.entries()) {
			const sourceNode = nodesByPath.get(sourcePath);
			for (const target of targets) {
				if (target === sourcePath) continue;

				const targetNode = nodesByPath.get(target);
				if (!targetNode && !KNOWN_NON_MAIN_ROUTES.has(target) && !isStaticAssetTarget(target)) {
					issues.push({ sourcePath, target, reason: 'unknown' });
					continue;
				}

				if (
					checkDraftLeaks &&
					sourceNode?.status === 'published' &&
					targetNode?.status === 'draft'
				) {
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

	function getReferencedStaticAssets(options?: {
		includeDrafts?: boolean;
	}): StaticAssetReference[] {
		const includeDrafts = options?.includeDrafts ?? false;
		const references: StaticAssetReference[] = [];

		for (const node of nodes) {
			if (!includeDrafts && node.status !== 'published') continue;
			for (const target of staticAssetsBySource.get(node.path) ?? []) {
				references.push({ sourcePath: node.path, target });
			}
		}

		return references;
	}

	return {
		nodes,
		getPageConnections,
		findBrokenInternalLinks,
		getReferencedStaticAssets
	};
}

function filenameFromPath(path: string): string {
	const filename = path.split('/').at(-1);
	if (!filename?.endsWith('.md')) {
		throw new Error(`Unable to derive a content filename from "${path}"`);
	}
	return filename;
}

function slugFromPath(path: string): string {
	return filenameFromPath(path).slice(0, -3);
}

const siteNodes: ContentGraphNodeInput[] = [];

for (const [slug, path] of Object.entries(STANDALONE_PAGE_PATHS) as [MainPageSlug, string][]) {
	const page = pageIntroductions[slug];
	if (!page) {
		throw new Error(`Missing required page "${slug}" for link registry`);
	}
	siteNodes.push({
		path,
		slug,
		kind: 'page',
		title: slug === 'home' ? 'Home' : page.title,
		summary: page.description,
		// Keep /blog treated as a draft target until at least one post is published.
		status: slug === 'blog' && !hasPublishedBlogPosts() ? 'draft' : 'published',
		related: page.related
	});
}

for (const project of projects) {
	siteNodes.push({
		path: `/work/${project.slug}`,
		slug: project.slug,
		kind: 'project',
		title: project.title,
		summary: project.summary,
		status: project.status,
		related: project.related
	});
}

for (const entry of experience) {
	siteNodes.push({
		path: `/work/experience/${entry.slug}`,
		slug: entry.slug,
		kind: 'experience',
		title: `${entry.role}, ${entry.organisation}`,
		summary: entry.summary,
		status: entry.status,
		related: entry.related
	});
}

for (const post of blogPosts) {
	siteNodes.push({
		path: `/blog/${post.slug}`,
		slug: post.slug,
		kind: 'blog',
		title: post.title,
		summary: post.summary,
		status: post.status,
		related: post.related
	});
}

for (const module of modules) {
	siteNodes.push({
		path: `/education/${module.slug}`,
		slug: module.slug,
		kind: 'module',
		title: `${module.code}: ${module.title}`,
		summary: module.summary,
		status: module.status,
		related: module.related
	});
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
const rawBlog = import.meta.glob<string>('../content/blog/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
});
const rawModules = import.meta.glob<string>('../content/modules/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
});

const markdownSources: { sourcePath: string; rawMarkdown: string }[] = [];

for (const [source, rawMarkdown] of Object.entries(rawPages)) {
	const slug = slugFromPath(source);
	if (NON_MAIN_PAGE_SLUGS.has(slug)) continue;
	const sourcePath = STANDALONE_PAGE_PATHS[slug as MainPageSlug] ?? EMBEDDED_PAGE_SOURCES[slug];
	if (!sourcePath) {
		throw new Error(`Unmapped page Markdown source "${source}" in link registry`);
	}
	markdownSources.push({ sourcePath, rawMarkdown });
}

for (const [source, rawMarkdown] of Object.entries(rawProjects)) {
	markdownSources.push({ sourcePath: `/work/${slugFromPath(source)}`, rawMarkdown });
}

for (const [source, rawMarkdown] of Object.entries(rawExperience)) {
	markdownSources.push({
		sourcePath: `/work/experience/${slugFromPath(source)}`,
		rawMarkdown
	});
}

for (const [source, rawMarkdown] of Object.entries(rawBlog)) {
	markdownSources.push({
		sourcePath: `/blog/${slugFromPath(source)}`,
		rawMarkdown
	});
}

for (const [source, rawMarkdown] of Object.entries(rawModules)) {
	const filename = filenameFromPath(source);
	const slug = moduleSlugsByFile[filename] ?? slugFromPath(source).toLocaleLowerCase('en-GB');
	markdownSources.push({ sourcePath: `/education/${slug}`, rawMarkdown });
}

const siteLinkGraph = createContentLinkGraph({
	nodes: siteNodes,
	markdownSources,
	getHomeProjectPaths(includeDrafts) {
		const visible = visibleProjects(includeDrafts);
		const selected = featuredProjects(includeDrafts);
		const homeProjects = (selected.length ? selected : visible).slice(0, 3);
		return homeProjects.map((project) => `/work/${project.slug}`);
	}
});

export const getPageConnections = siteLinkGraph.getPageConnections;
export const findBrokenInternalLinks = siteLinkGraph.findBrokenInternalLinks;
export const getReferencedStaticAssets = siteLinkGraph.getReferencedStaticAssets;
