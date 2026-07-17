import type {} from './env.d.ts';
import { applyD1Migrations } from 'cloudflare:test';
import { env } from 'cloudflare:test';

await applyD1Migrations(env.BOOKCLUB_DB, env.TEST_MIGRATIONS);
