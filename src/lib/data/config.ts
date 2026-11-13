// Keep public contact details and navigation destinations in one place so routes do not drift.

export const site = {
	origin: 'https://ramisbhatty.com',
	pagesHostname: 'ramisbhatty-com-ect.pages.dev'
} as const;

export const contact = {
	name: 'Ramis Bhatty',
	email: 'contact@ramisbhatty.com',
	ad_email: 'advertising@ramisbhatty.com',
	github: 'https://github.com/strawma',
	linkedin: 'https://www.linkedin.com/in/ramis-bhatty/'
} as const;

export const nav = {
	home: '',
	about: 'about',
	work: 'work',
	education: 'education',
	cv: 'cv',
	silly: 'silly',
	legacy: 'silly/legacy'
} as const;

export const documents = {
	cv: 'documents/ramis-bhatty-cv.pdf'
} as const;
