export type PublicationStatus = 'draft' | 'published';
export type ContentArea = 'professional' | 'personal';

export interface CollectionMetadata {
	area: ContentArea;
	status: PublicationStatus;
	featured?: boolean;
	order?: number;
	updatedAt?: string;
	related?: string[];
}

export interface ContentLink {
	label: string;
	href: string;
	external?: boolean;
}

export interface ContentImage {
	src: string;
	alt: string;
	caption?: string;
}

export interface ContentSection {
	heading: string;
	paragraphs?: string[];
	bullets?: string[];
	links?: ContentLink[];
	images?: ContentImage[];
}

export interface PersonalProfile {
	introduction: string;
	about: string;
	currentFocus: FocusItem[];
}

export interface FocusItem {
	text: string;
	href?: string;
	linkLabel?: string;
}

export interface EducationProfile {
	overview: string;
}

export interface Experience extends CollectionMetadata {
	slug: string;
	organisation: string;
	role: string;
	period: string;
	summary: string;
	sections: ContentSection[];
	links: ContentLink[];
}

export interface InterestItem {
	title: string;
	note?: string;
	href?: string;
	date?: string;
}

export interface InterestCategory extends CollectionMetadata {
	slug: string;
	title: string;
	summary: string;
	items: InterestItem[];
}

export interface AcademicModule extends CollectionMetadata {
	code: string;
	title: string;
	year: string;
	summary: string;
	topics: string[];
	sections: ContentSection[];
}

export interface Project extends CollectionMetadata {
	slug: string;
	title: string;
	summary: string;
	moduleCode?: string;
	period?: string;
	technologies: string[];
	sections: ContentSection[];
	links: ContentLink[];
}

export interface Post extends CollectionMetadata {
	slug: string;
	title: string;
	summary: string;
	publishedAt?: string;
	topics: string[];
	sections: ContentSection[];
	links: ContentLink[];
}

export interface PageIntroduction {
	path: string;
	title: string;
	description: string;
	lead: string;
}

export interface ExploreDestination {
	title: string;
	href: string;
	description: string;
}
