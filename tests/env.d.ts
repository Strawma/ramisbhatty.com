/// <reference types="@cloudflare/vitest-plugin/types" />

import type {} from '../src/app.d.ts';
import type { D1Migration } from '@cloudflare/workers-types';

declare global {
	namespace Cloudflare {
		interface Env {
			TEST_MIGRATIONS: D1Migration[];
		}
	}
}
