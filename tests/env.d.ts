/// <reference types="@cloudflare/vitest-plugin/types" />

import type { D1Database, D1Migration } from '@cloudflare/workers-types';

declare global {
	namespace Cloudflare {
		interface Env {
			BOOKCLUB_DB: D1Database;
			TEST_MIGRATIONS: D1Migration[];
		}
	}
}
