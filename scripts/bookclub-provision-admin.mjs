import { randomUUID } from 'node:crypto';
import {
	DATABASE_NAME,
	ask,
	askSecret,
	hashInviteCode,
	runWrangler,
	sqlString
} from './bookclub-provisioning.mjs';

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
	// Bootstrap is intentionally limited to an empty member table. Later members should be added
	// through an authenticated admin workflow rather than by rerunning this command.
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
