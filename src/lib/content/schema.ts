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
	currentFocus: string[];
}

export interface EducationProfile {
	overview: string;
}

export interface Experience {
	slug: string;
	organisation: string;
	role: string;
	period: string;
	summary: string;
	published: boolean;
}

export interface InterestCategory {
	slug: string;
	title: string;
	summary: string;
	items: string[];
}

export interface AcademicModule {
	code: string;
	title: string;
	year: string;
	summary: string;
	topics: string[];
	sections: ContentSection[];
	published: boolean;
}

export interface Project {
	slug: string;
	title: string;
	summary: string;
	moduleCode?: string;
	period?: string;
	technologies: string[];
	sections: ContentSection[];
	links: ContentLink[];
	published: boolean;
}
