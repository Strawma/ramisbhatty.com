import type { Post } from '../schema';

const firstPost = {
	slug: 'first-post',
	title: 'TODO: First post title',
	summary: 'TODO: Summarise the note, review, or idea in one or two sentences.',
	topics: ['TODO: Topic'],
	sections: [
		{
			heading: 'The idea',
			paragraphs: ['TODO: Develop the main idea in your own words.']
		},
		{
			heading: 'Notes and references',
			paragraphs: ['TODO: Add useful context, evidence, or links.']
		}
	],
	links: [],
	area: 'professional',
	status: 'draft',
	order: 10
} satisfies Post;

export default firstPost;
