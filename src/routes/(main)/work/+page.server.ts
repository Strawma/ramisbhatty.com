import { dev } from '$app/environment';
import { visibleProjects } from '$lib/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({ projects: visibleProjects(dev) });
