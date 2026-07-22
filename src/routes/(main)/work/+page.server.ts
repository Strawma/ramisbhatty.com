import { dev } from '$app/environment';
import { visibleProjects } from '$lib/data/main-site';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({ projects: visibleProjects(dev) });
