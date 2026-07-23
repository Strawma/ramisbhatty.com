import { dev } from '$app/environment';
import { education, visibleModules } from '$lib/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({ education, modules: visibleModules(dev) });
