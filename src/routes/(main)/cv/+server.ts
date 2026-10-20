import { documents } from '#lib/data/config.ts';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => redirect(307, documents.cv);
