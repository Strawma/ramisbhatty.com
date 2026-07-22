// Keep public contact details and navigation destinations in one place so routes do not drift.

export const contact = {
	name: 'Ramis Bhatty',
	email: 'contact@ramisbhatty.com',
	ad_email: 'advertising@ramisbhatty.com',
	github: 'https://github.com/strawma',
	linkedin: 'https://linkedin.com/in/ramis-bhatty-226305297'
} as const;

export const nav = {
	home: '/',
	about: '/about',
	work: '/work',
	education: '/education',
	blog: '/blog',
	interests: '/interests',
	cv: '/cv',
	silly: '/silly',
	legacy: 'https://legacy.ramisbhatty.com'
} as const;
