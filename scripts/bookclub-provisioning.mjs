import { randomBytes, webcrypto } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

export const DATABASE_NAME = 'ramis-bookclub';
const INVITE_HASH_ITERATIONS = 120_000;
const MAX_INVITE_HASH_ITERATIONS = 1_000_000;

export function sqlString(value) {
	return `'${value.replaceAll("'", "''")}'`;
}

export function ask(question) {
	const input = createInterface({ input: process.stdin, output: process.stdout });

	return new Promise((resolve) => {
		input.question(question, (answer) => {
			input.close();
			resolve(answer.trim());
		});
	});
}

export function askSecret(question) {
	if (!process.stdin.isTTY) {
		throw new Error('Invite codes must be entered from an interactive terminal.');
	}

	return new Promise((resolve, reject) => {
		let value = '';
		const input = process.stdin;

		process.stdout.write(question);
		input.setRawMode(true);
		input.resume();

		const finish = (error) => {
			input.setRawMode(false);
			input.pause();
			input.removeListener('data', onData);
			process.stdout.write('\n');

			if (error) {
				reject(error);
			} else {
				resolve(value.replaceAll('\u001b[200~', '').replaceAll('\u001b[201~', ''));
			}
		};

		const onData = (chunk) => {
			for (const character of chunk.toString()) {
				if (character === '\u0003') {
					finish(new Error('Provisioning cancelled.'));
					return;
				}

				if (character === '\r' || character === '\n') {
					finish();
					return;
				}

				if (character === '\u007f' || character === '\b') {
					value = value.slice(0, -1);
				} else {
					value += character;
				}
			}
		};

		input.on('data', onData);
	});
}

export async function hashInviteCode(inviteCode) {
	const salt = randomBytes(16);
	const key = await webcrypto.subtle.importKey(
		'raw',
		Buffer.from(inviteCode, 'utf8'),
		{ name: 'PBKDF2' },
		false,
		['deriveBits']
	);
	const derived = await webcrypto.subtle.deriveBits(
		{
			name: 'PBKDF2',
			salt,
			iterations: INVITE_HASH_ITERATIONS,
			hash: 'SHA-256'
		},
		key,
		256
	);

	return `pbkdf2-sha256$${INVITE_HASH_ITERATIONS}$${salt.toString('base64url')}$${Buffer.from(derived).toString('base64url')}`;
}

export async function verifyInviteCode(inviteCode, encodedHash) {
	const [algorithm, iterationsValue, saltValue, digestValue] = encodedHash.split('$');
	const iterations = Number(iterationsValue);

	if (
		algorithm !== 'pbkdf2-sha256' ||
		!Number.isSafeInteger(iterations) ||
		iterations <= 0 ||
		iterations > MAX_INVITE_HASH_ITERATIONS ||
		!saltValue ||
		!digestValue
	) {
		return false;
	}

	try {
		const salt = Buffer.from(saltValue, 'base64url');
		const expected = Buffer.from(digestValue, 'base64url');
		const key = await webcrypto.subtle.importKey(
			'raw',
			Buffer.from(inviteCode, 'utf8'),
			{ name: 'PBKDF2' },
			false,
			['deriveBits']
		);
		const derived = await webcrypto.subtle.deriveBits(
			{
				name: 'PBKDF2',
				salt,
				iterations,
				hash: 'SHA-256'
			},
			key,
			256
		);
		const actual = Buffer.from(derived);

		return actual.length === expected.length && actual.equals(expected);
	} catch {
		return false;
	}
}

export function runWrangler(command, json = false) {
	const args = [
		'exec',
		'wrangler',
		'd1',
		'execute',
		DATABASE_NAME,
		'--remote',
		'--command',
		command
	];

	if (json) {
		args.push('--json');
	}

	return new Promise((resolve, reject) => {
		const child = spawn('pnpm', args, { stdio: ['ignore', 'pipe', 'pipe'] });
		let output = '';
		let errors = '';

		child.stdout.on('data', (chunk) => {
			output += chunk;
		});
		child.stderr.on('data', (chunk) => {
			errors += chunk;
		});
		child.on('error', reject);
		child.on('close', (code) => {
			if (code !== 0) {
				reject(new Error(errors.trim() || `Wrangler exited with code ${code}.`));
			} else {
				resolve(output);
			}
		});
	});
}
