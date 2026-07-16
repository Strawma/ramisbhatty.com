import { randomBytes, randomUUID, webcrypto } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

const DATABASE_NAME = 'ramis-bookclub';
const INVITE_HASH_ITERATIONS = 120_000;

function sqlString(value) {
	return `'${value.replaceAll("'", "''")}'`;
}

function ask(question) {
	const input = createInterface({ input: process.stdin, output: process.stdout });

	return new Promise((resolve) => {
		input.question(question, (answer) => {
			input.close();
			resolve(answer.trim());
		});
	});
}

function askSecret(question) {
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
				resolve(value);
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

async function hashInviteCode(inviteCode) {
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

function runWrangler(command, json = false) {
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

function readCount(output) {
	const payload = JSON.parse(output);
	const count = payload?.[0]?.results?.[0]?.count;

	if (!Number.isInteger(count)) {
		throw new Error('Could not read the member count from Wrangler. No changes were made.');
	}

	return count;
}

function readInsertedMember(output, id) {
	const payload = JSON.parse(output);
	const member = payload?.[0]?.results?.find((result) => result.id === id);

	if (!member) {
		throw new Error(
			'The admin record could not be verified after insertion. Check D1 before retrying.'
		);
	}
}

async function main() {
	console.log(`Checking ${DATABASE_NAME} before creating the first admin...`);
	const countOutput = await runWrangler('SELECT COUNT(*) AS count FROM bookclub_members;', true);

	if (readCount(countOutput) !== 0) {
		throw new Error(
			'bookclub_members is not empty. This bootstrap command refuses to add another admin.'
		);
	}

	const name = await ask('Admin display name: ');

	if (name.length === 0 || name.length > 100) {
		throw new Error('The display name must contain between 1 and 100 characters.');
	}

	const inviteCode = await askSecret('Invite code (hidden): ');

	if (inviteCode.length < 16 || inviteCode.length > 256) {
		throw new Error(
			'Use an invite code between 16 and 256 characters; 24+ random characters is recommended.'
		);
	}

	const confirmation = await askSecret('Repeat invite code (hidden): ');

	if (inviteCode !== confirmation) {
		throw new Error('The invite codes did not match.');
	}

	const id = randomUUID();
	const inviteCodeHash = await hashInviteCode(inviteCode);
	const insert = `INSERT INTO bookclub_members (id, name, invite_code_hash, role, active)
SELECT ${sqlString(id)}, ${sqlString(name)}, ${sqlString(inviteCodeHash)}, 'admin', 1
WHERE NOT EXISTS (SELECT 1 FROM bookclub_members);`;

	console.log('Creating the admin record remotely...');
	await runWrangler(insert);

	const verify = await runWrangler(
		`SELECT id, name, role FROM bookclub_members WHERE id = ${sqlString(id)};`,
		true
	);
	readInsertedMember(verify, id);

	console.log(`Admin ${JSON.stringify(name)} was created successfully.`);
	console.log('The invite code was never written to the database or printed by this script.');
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exitCode = 1;
});
