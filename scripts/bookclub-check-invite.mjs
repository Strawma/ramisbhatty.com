import {
	ask,
	askSecret,
	isValidUsername,
	normalizeUsername,
	runWrangler,
	verifyInviteCode
} from './bookclub-provisioning.mjs';

async function main() {
	// This command is read-only and helps separate a bad code from a deployed-runtime issue.
	const output = await runWrangler(
		`SELECT id, username, name, role, invite_code_hash FROM bookclub_members WHERE active = 1;`,
		true
	);
	const payload = JSON.parse(output);
	const members = payload?.[0]?.results;

	if (!Array.isArray(members)) {
		throw new Error('Could not read active members from D1. No changes were made.');
	}

	const username = normalizeUsername(await ask('Username: '));
	if (!isValidUsername(username)) throw new Error('That username is not valid.');

	const member = members.find((candidate) => candidate.username === username);
	const inviteCode = await askSecret('Login code to check (hidden): ');

	if (member && (await verifyInviteCode(inviteCode, member.invite_code_hash))) {
		console.log(`Login matches active ${member.role} ${JSON.stringify(member.name)}.`);
		return;
	}

	console.log('Username and login code do not match an active member in the remote D1 database.');
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exitCode = 1;
});
