<script lang="ts">
	import { resolve } from '$app/paths';
	import type { ResolvedPathname } from '$app/types';
	import type { ContentKind, ContentLink } from '#lib/content-links.ts';

	interface ParentLink {
		label: string;
		href: ResolvedPathname;
	}

	interface Props {
		related?: ContentLink[];
		mentionedBy?: ContentLink[];
		parent?: ParentLink;
	}

	let { related = [], mentionedBy = [], parent }: Props = $props();

	const KIND_LABELS: Record<ContentKind, string> = {
		project: 'Project',
		experience: 'Experience',
		blog: 'Blog',
		module: 'Module',
		page: 'Page'
	};

	function hrefFor(item: ContentLink): ResolvedPathname {
		switch (item.kind) {
			case 'project':
				return resolve('/(main)/work/[slug]', { slug: item.slug });
			case 'experience':
				return resolve('/(main)/work/experience/[slug]', { slug: item.slug });
			case 'blog':
				return resolve('/(main)/blog/[slug]', { slug: item.slug });
			case 'module':
				return resolve('/(main)/education/[code]', { code: item.slug });
			case 'page': {
				const pageSlug = item.slug;
				switch (pageSlug) {
					case 'home':
						return resolve('');
					case 'cv':
						return resolve('cv');
					case 'education':
						return resolve('education');
					case 'blog':
						return resolve('blog');
					case 'go2-poster':
						return resolve('/(main)/work/go2-lidar-perception/poster');
					default: {
						const unreachable: never = pageSlug;
						return unreachable;
					}
				}
			}
		}
	}
</script>

{#if related.length || mentionedBy.length || parent}
	<aside
		aria-label="Connected pages"
		class="not-prose mt-12 space-y-6 border-t border-neutral-300 pt-6 text-sm text-neutral-700 dark:border-neutral-800 dark:text-neutral-300 print:hidden"
	>
		{#if related.length}
			<section>
				<h2
					class="font-mono text-xs tracking-wide text-neutral-500 uppercase dark:text-neutral-400"
				>
					Related
				</h2>
				<ul class="mt-3 space-y-2">
					{#each related as item (item.path)}
						<li>
							<a class="text-neutral-900 dark:text-neutral-100" href={hrefFor(item)}>
								{item.title}
							</a>
							{#if item.status === 'draft'}
								<span class="font-mono text-xs text-amber-800 dark:text-amber-300">
									(local draft)
								</span>
							{/if}
							— {item.summary}
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if mentionedBy.length}
			<section>
				<h2
					class="font-mono text-xs tracking-wide text-neutral-500 uppercase dark:text-neutral-400"
				>
					Mentioned by
				</h2>
				<ul class="mt-3 space-y-2">
					{#each mentionedBy as item (item.path)}
						<li class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
							<a class="text-neutral-900 dark:text-neutral-100" href={hrefFor(item)}>
								{item.title}
							</a>
							<span class="font-mono text-xs text-neutral-500 dark:text-neutral-400">
								{KIND_LABELS[item.kind]}
							</span>
							{#if item.status === 'draft'}
								<span class="font-mono text-xs text-amber-800 dark:text-amber-300">
									(local draft)
								</span>
							{/if}
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if parent}
			<p>
				<a class="text-neutral-900 dark:text-neutral-100" href={parent.href}>
					← {parent.label}
				</a>
			</p>
		{/if}
	</aside>
{/if}
