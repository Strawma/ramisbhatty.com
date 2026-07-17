<script lang="ts">
	import { enhance } from '$app/forms';
	import ClubNav from '../ClubNav.svelte';

	let { data, form } = $props();

	function formatDate(value: string): string {
		return new Date(value).toLocaleString([], {
			dateStyle: 'medium',
			timeStyle: 'short'
		});
	}

	function invitationLabel(invitation: (typeof data.invitations)[number]): string {
		if (invitation.consumedAt) return 'USED';
		if (invitation.revokedAt) return 'REVOKED';
		if (new Date(invitation.expiresAt).getTime() <= Date.now()) return 'EXPIRED';
		return 'ACTIVE';
	}
</script>

<svelte:head>
	<title>BMBMT Admin | Ramis Bhatty</title>
	<meta
		name="description"
		content="Private administration for the Bournemouth Mini Book Meet Thing."
	/>
</svelte:head>

<main class="min-h-screen bg-[#008080] p-2 font-mono text-sm text-black sm:p-4">
	<div class="mx-auto max-w-7xl border-4 border-black bg-[#d4d0c8] shadow-[6px_6px_0_#000]">
		<header
			class="flex flex-wrap items-center justify-between gap-2 border-b-4 border-black bg-[#000080] px-3 py-2 font-bold text-white"
		>
			<h1>BMBMT // WORKING TITLE</h1>
			<p class="text-xs text-cyan-200">ADMINISTRATION TERMINAL</p>
		</header>

		<div class="md:flex">
			<ClubNav member={data.member} />

			<div class="min-w-0 flex-1 bg-[#008080] p-3 sm:p-5">
				<section class="border-4 border-black bg-[#d4d0c8] shadow-[4px_4px_0_#000]">
					<div class="border-b-2 border-black bg-[#800000] px-3 py-2 font-bold text-white">
						ADMIN CONSOLE // MEMBER OPERATIONS
					</div>
					<div class="p-4 sm:p-5">
						<p class="text-xs font-bold text-[#800000] uppercase">Restricted area</p>
						<h2 class="mt-2 text-2xl font-black sm:text-4xl">Manage the clubhouse.</h2>
						<p class="mt-3 max-w-3xl leading-6">
							Create private setup links, reset forgotten login codes, and keep inactive members out
							of the reading zone. Permanent codes are never shown here.
						</p>
						{#if form?.error || form?.success}
							<p
								class:text-green-700={form?.success}
								class="mt-4 border-2 border-black bg-white px-3 py-2 font-bold text-[#800000]"
								role={form?.error ? 'alert' : 'status'}
							>
								{form.error ?? form.success}
							</p>
						{/if}
						{#if form?.invitationUrl}
							<div class="mt-4 border-2 border-black bg-[#ffffcc] p-3">
								<p class="font-bold text-[#800000]">PRIVATE SETUP LINK // COPY NOW</p>
								<p class="mt-1 text-xs">This link is shown once and expires in 48 hours.</p>
								<input
									readonly
									value={form.invitationUrl}
									aria-label="New private setup link"
									class="mt-2 w-full border-2 border-black bg-white px-2 py-2 text-xs"
								/>
							</div>
						{/if}
					</div>
				</section>

				<div class="mt-5 grid gap-5 lg:grid-cols-2">
					<section class="border-4 border-black bg-[#d4d0c8] shadow-[4px_4px_0_#000]">
						<div class="border-b-2 border-black bg-[#000080] px-3 py-2 font-bold text-white">
							INVITE A NEW MEMBER
						</div>
						<form method="POST" action="?/createInvitation" use:enhance class="space-y-3 p-4">
							<label for="username" class="block font-bold">USERNAME</label>
							<input
								id="username"
								name="username"
								maxlength="32"
								required
								placeholder="e.g. alex"
								class="w-full border-2 border-black bg-white px-2 py-2 focus:ring-2 focus:ring-[#000080] focus:outline-none"
							/>
							<p class="text-xs leading-5">This is the unique name they will use to log in.</p>
							<label for="display-name" class="block font-bold">DISPLAY NAME</label>
							<input
								id="display-name"
								name="displayName"
								maxlength="24"
								required
								placeholder="e.g. Alex"
								class="w-full border-2 border-black bg-white px-2 py-2 focus:ring-2 focus:ring-[#000080] focus:outline-none"
							/>
							<button
								type="submit"
								class="border-2 border-black bg-[#d4d0c8] px-3 py-2 font-bold shadow-[2px_2px_0_#000] hover:bg-white focus:ring-2 focus:ring-[#000080] focus:outline-none"
							>
								CREATE SETUP LINK
							</button>
						</form>
					</section>

					<section class="border-4 border-black bg-[#d4d0c8] shadow-[4px_4px_0_#000]">
						<div class="border-b-2 border-black bg-[#800080] px-3 py-2 font-bold text-white">
							RESET A MEMBER LOGIN CODE
						</div>
						<form method="POST" action="?/resetInvite" use:enhance class="space-y-3 p-4">
							<label for="reset-member" class="block font-bold">MEMBER</label>
							<select
								id="reset-member"
								name="memberId"
								required
								class="w-full border-2 border-black bg-white px-2 py-2 focus:ring-2 focus:ring-[#000080] focus:outline-none"
							>
								<option value="">Choose a member</option>
								{#each data.members as member (member.id)}
									<option value={member.id}
										>{member.name} ({member.active ? 'active' : 'inactive'})</option
									>
								{/each}
							</select>
							<p class="text-xs leading-5">
								The member chooses a replacement code. Existing sessions are invalidated when the
								link is used.
							</p>
							<button
								type="submit"
								class="border-2 border-black bg-[#d4d0c8] px-3 py-2 font-bold shadow-[2px_2px_0_#000] hover:bg-white focus:ring-2 focus:ring-[#000080] focus:outline-none"
							>
								CREATE RESET LINK
							</button>
						</form>
					</section>
				</div>

				<section class="mt-5 border-4 border-black bg-[#d4d0c8] shadow-[4px_4px_0_#000]">
					<div class="border-b-2 border-black bg-[#808080] px-3 py-2 font-bold text-white">
						MEMBERS // {data.members.length} RECORDS
					</div>
					<div class="overflow-x-auto p-4">
						<table class="w-full min-w-[680px] border-2 border-black bg-white text-left text-xs">
							<thead class="bg-[#c0c0c0] font-bold">
								<tr>
									<th class="border border-black px-2 py-2">USERNAME</th>
									<th class="border border-black px-2 py-2">NAME</th>
									<th class="border border-black px-2 py-2">ROLE</th>
									<th class="border border-black px-2 py-2">STATUS</th>
									<th class="border border-black px-2 py-2">ACTIONS</th>
								</tr>
							</thead>
							<tbody>
								{#each data.members as member (member.id)}
									<tr>
										<td class="border border-black px-2 py-2">{member.username}</td>
										<td class="border border-black px-2 py-2 font-bold">{member.name}</td>
										<td class="border border-black px-2 py-2">{member.role.toUpperCase()}</td>
										<td class="border border-black px-2 py-2"
											>{member.active ? 'ACTIVE' : 'INACTIVE'}</td
										>
										<td class="border border-black px-2 py-2">
											<div class="flex flex-wrap gap-2">
												<form method="POST" action="?/setUsername" use:enhance class="flex gap-1">
													<input type="hidden" name="memberId" value={member.id} />
													<input
														name="username"
														value={member.username}
														maxlength="32"
														aria-label={`Username for ${member.name}`}
														class="w-32 border border-black px-1 py-1"
													/>
													<button
														type="submit"
														class="border border-black bg-[#d4d0c8] px-2 py-1 font-bold hover:bg-white focus:ring-2 focus:ring-[#000080] focus:outline-none"
													>
														SAVE USERNAME
													</button>
												</form>
												{#if member.id !== data.member.id}
													<form method="POST" action="?/setMemberActive" use:enhance>
														<input type="hidden" name="memberId" value={member.id} />
														<input
															type="hidden"
															name="active"
															value={member.active ? 'false' : 'true'}
														/>
														<button
															type="submit"
															class="border border-black bg-[#d4d0c8] px-2 py-1 font-bold hover:bg-white focus:ring-2 focus:ring-[#000080] focus:outline-none"
														>
															{member.active ? 'DEACTIVATE' : 'REACTIVATE'}
														</button>
													</form>
												{/if}
												<form method="POST" action="?/logoutAll" use:enhance>
													<input type="hidden" name="memberId" value={member.id} />
													<button
														type="submit"
														class="border border-black bg-[#fff0f0] px-2 py-1 font-bold text-[#800000] hover:bg-white focus:ring-2 focus:ring-[#000080] focus:outline-none"
													>
														LOG OUT ALL
													</button>
												</form>
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</section>

				<section class="mt-5 border-4 border-black bg-[#d4d0c8] shadow-[4px_4px_0_#000]">
					<div class="border-b-2 border-black bg-[#000080] px-3 py-2 font-bold text-white">
						SETUP LINKS // LAST 50
					</div>
					<div class="overflow-x-auto p-4">
						<table class="w-full min-w-[760px] border-2 border-black bg-white text-left text-xs">
							<thead class="bg-[#c0c0c0] font-bold">
								<tr>
									<th class="border border-black px-2 py-2">TYPE</th>
									<th class="border border-black px-2 py-2">MEMBER</th>
									<th class="border border-black px-2 py-2">STATUS</th>
									<th class="border border-black px-2 py-2">EXPIRES</th>
									<th class="border border-black px-2 py-2">ACTION</th>
								</tr>
							</thead>
							<tbody>
								{#each data.invitations as invitation (invitation.id)}
									<tr>
										<td class="border border-black px-2 py-2 font-bold"
											>{invitation.purpose.toUpperCase()}</td
										>
										<td class="border border-black px-2 py-2">
											{invitation.username}: {invitation.memberName ?? invitation.displayName}
										</td>
										<td class="border border-black px-2 py-2">{invitationLabel(invitation)}</td>
										<td class="border border-black px-2 py-2">{formatDate(invitation.expiresAt)}</td
										>
										<td class="border border-black px-2 py-2">
											{#if invitationLabel(invitation) === 'ACTIVE'}
												<form method="POST" action="?/revokeInvitation" use:enhance>
													<input type="hidden" name="invitationId" value={invitation.id} />
													<button
														type="submit"
														class="border border-black bg-[#fff0f0] px-2 py-1 font-bold text-[#800000] hover:bg-white focus:ring-2 focus:ring-[#000080] focus:outline-none"
													>
														REVOKE
													</button>
												</form>
											{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</section>
			</div>
		</div>

		<footer class="border-t-4 border-black bg-[#808080] px-3 py-2 text-xs text-white">
			ADMIN TERMINAL // RAW TOKENS ARE NEVER STORED OR DISPLAYED AFTER THIS RESPONSE
		</footer>
	</div>
</main>
