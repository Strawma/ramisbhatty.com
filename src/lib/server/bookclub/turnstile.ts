const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TURNSTILE_ACTION = 'bookclub-login';

interface TurnstileVerificationResponse {
	success: boolean;
	action?: string;
}

/** Verify a one-use Turnstile response before allowing an expensive D1 lookup. */
export async function verifyTurnstileToken(
	token: string,
	secret: string,
	remoteIp?: string
): Promise<boolean> {
	if (token.length === 0 || token.length > 2048 || secret.length === 0) {
		return false;
	}

	const body = new URLSearchParams({ secret, response: token });

	if (remoteIp) {
		body.set('remoteip', remoteIp);
	}

	try {
		const response = await fetch(TURNSTILE_VERIFY_URL, {
			method: 'POST',
			headers: { 'content-type': 'application/x-www-form-urlencoded' },
			body,
			signal: AbortSignal.timeout(5000)
		});

		if (!response.ok) {
			return false;
		}

		const result = (await response.json()) as TurnstileVerificationResponse;
		return result.success === true && result.action === TURNSTILE_ACTION;
	} catch {
		return false;
	}
}
