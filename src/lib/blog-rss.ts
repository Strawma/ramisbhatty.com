import type { BlogPost } from './content';
import { contact, site } from './data/config';

function escapeXml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

function toRfc2822Utc(isoDate: string): string {
	return new Date(`${isoDate}T00:00:00Z`).toUTCString();
}

export function buildBlogRssXml(posts: readonly BlogPost[]): string {
	const published = posts
		.filter((post): post is BlogPost & { publishedAt: string } => {
			return post.status === 'published' && Boolean(post.publishedAt);
		})
		.sort(
			(left, right) =>
				right.publishedAt.localeCompare(left.publishedAt) ||
				left.title.localeCompare(right.title, 'en-GB')
		);

	const blogUrl = `${site.origin}/blog`;
	const feedUrl = `${site.origin}/blog/rss.xml`;
	const lastBuildDate = published[0]
		? `\n    <lastBuildDate>${escapeXml(toRfc2822Utc(published[0].publishedAt))}</lastBuildDate>`
		: '';

	const items = published
		.map((post) => {
			const postUrl = `${site.origin}/blog/${post.slug}`;
			const categories = post.topics
				.map((topic) => `\n      <category>${escapeXml(topic)}</category>`)
				.join('');
			return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(postUrl)}</link>
      <guid isPermaLink="true">${escapeXml(postUrl)}</guid>
      <pubDate>${escapeXml(toRfc2822Utc(post.publishedAt))}</pubDate>
      <description>${escapeXml(post.summary)}</description>${categories}
    </item>`;
		})
		.join('\n');

	return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(`${contact.name} — Blog`)}</title>
    <link>${escapeXml(blogUrl)}</link>
    <description>Technical writing and notes by ${escapeXml(contact.name)}.</description>
    <language>en-GB</language>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />${lastBuildDate}${items ? `\n${items}` : ''}
  </channel>
</rss>
`;
}
