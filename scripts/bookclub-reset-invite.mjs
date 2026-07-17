import {
	ask,
	askSecret,
	hashInviteCode,
	runWrangler,
	sqlString
} from './bookclub-provisioning.mjs';

function readAdmins(output) {
	const payload = JSON.parse(output);
	const admins = payload?.[0]?.results;

	if (!Array.isArray(admins) || admins.length === 0) {
		throw new Error('No active admin was found.');
	}

	return admins;
}

async function main() {
	// Reset only changes the selected admin hash; it does not create, deactivate, or delete members.
	const admins = readAdmins(
		await runWrangler(
			`SELECT id, username, name, role FROM bookclub_members WHERE role = 'admin' AND active = 1 ORDER BY created_at;`,
			true
		)
	);

	let admin = admins[0];

	if (admins.length > 1) {
		console.log('Active admins:');
		for (const candidate of admins) {
			console.log(`- ${candidate.username} / ${candidate.name} (${candidate.id})`);
		}

		const id = await ask('Enter the admin ID to reset: ');
		admin = admins.find((candidate) => candidate.id === id);

		if (!admin) {
			throw new Error('That admin ID was not found.');
		}
	}

	console.log(`Resetting the invite code for ${JSON.stringify(admin.name)}.`);
	const inviteCode = await askSecret('New invite code (hidden): ');

	if (inviteCode.length < 12 || inviteCode.length > 256) {
		throw new Error(
			'Use a login code between 12 and 256 characters; 16+ random characters is recommended.'
		);
	}

	const confirmation = await askSecret('Repeat invite code (hidden): ');

	if (inviteCode !== confirmation) {
		throw new Error('The invite codes did not match.');
	}

	const inviteCodeHash = await hashInviteCode(inviteCode);
	await runWrangler(
		`UPDATE bookclub_members SET invite_code_hash = ${sqlString(inviteCodeHash)} WHERE id = ${sqlString(admin.id)} AND role = 'admin' AND active = 1;`
	);

	console.log('The admin invite code was reset successfully.');
	console.log('The invite code was never written to the database or printed by this script.');
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exitCode = 1;
});
