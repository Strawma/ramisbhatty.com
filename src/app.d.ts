// A types reference loads Workers' ambient entry point; imports load module-scoped types instead.
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="@cloudflare/workers-types" />

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { D1Database } from '@cloudflare/workers-types';

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
	}

	namespace Cloudflare {
		interface Env {
			// These names must stay aligned with the production Pages bindings and vars.
			BOOKCLUB_DB: D1Database;
			TURNSTILE_SITE_KEY?: string;
			TURNSTILE_SECRET_KEY?: string;
		}
	}
}

export {};
