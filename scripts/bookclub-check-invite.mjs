import { askSecret, runWrangler, verifyInviteCode } from './bookclub-provisioning.mjs';

async function main() {
	const output = await runWrangler(
		`SELECT id, name, role, invite_code_hash FROM bookclub_members WHERE active = 1;`,
		true
	);
	const payload = JSON.parse(output);
	const members = payload?.[0]?.results;

	if (!Array.isArray(members)) {
		throw new Error('Could not read active members from D1. No changes were made.');
	}

	const inviteCode = await askSecret('Invite code to check (hidden): ');

	for (const member of members) {
		if (await verifyInviteCode(inviteCode, member.invite_code_hash)) {
			console.log(`Invite matches active ${member.role} ${JSON.stringify(member.name)}.`);
			return;
		}
	}

	console.log('Invite does not match any active member in the remote D1 database.');
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exitCode = 1;
});
