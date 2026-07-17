// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { D1Database } from '@cloudflare/workers-types';

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env: {
				// These names must stay aligned with the production Pages bindings and vars.
				BOOKCLUB_DB: D1Database;
				TURNSTILE_SITE_KEY?: string;
				TURNSTILE_SECRET_KEY?: string;
			};
		}
	}
}

export {};
