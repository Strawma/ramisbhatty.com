import { dev } from '$app/environment';
import { visibleModules } from '$lib/data/main-site';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({ modules: visibleModules(dev) });
