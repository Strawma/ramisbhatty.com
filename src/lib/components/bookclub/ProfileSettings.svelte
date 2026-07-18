<script lang="ts">
	import { enhance } from '$app/forms';

	type Member = {
		name: string;
		chatColor: string;
	};

	let { member }: { member: Member } = $props();
</script>

<div class="grid gap-4 p-4 sm:grid-cols-2">
	<form
		method="POST"
		action="?/changeDisplayName"
		use:enhance
		class="space-y-2 border-2 border-black bg-white p-3"
	>
		<label for="profile-display-name" class="block text-xs font-bold text-[#000080]"
			>YOUR DISPLAY NAME</label
		>
		<input
			id="profile-display-name"
			name="displayName"
			maxlength="24"
			required
			value={member.name}
			class="w-full border-2 border-black bg-white px-2 py-2 text-xs focus:ring-2 focus:ring-[#000080] focus:outline-none"
		/>
		<p class="text-[10px] text-gray-600">1-24 characters. Changes are announced in chat.</p>
		<button
			type="submit"
			class="border-2 border-black bg-[#d4d0c8] px-3 py-1 text-xs font-bold shadow-[2px_2px_0_#000] hover:bg-gray-100 focus:ring-2 focus:ring-[#000080] focus:outline-none"
		>
			SAVE NAME
		</button>
	</form>

	<form
		method="POST"
		action="?/changeChatColor"
		use:enhance
		class="space-y-2 border-2 border-black bg-white p-3"
	>
		<label for="profile-chat-color" class="block text-xs font-bold text-[#000080]"
			>YOUR CHAT COLOR</label
		>
		<input
			id="profile-chat-color"
			name="chatColor"
			type="color"
			value={member.chatColor}
			class="h-10 w-full cursor-pointer border-2 border-black bg-white p-1"
		/>
		<p class="text-[10px] text-gray-600">
			Your name in chat uses this color. Dark colors become high-contrast badges automatically.
		</p>
		<button
			type="submit"
			class="border-2 border-black bg-[#d4d0c8] px-3 py-1 text-xs font-bold shadow-[2px_2px_0_#000] hover:bg-gray-100 focus:ring-2 focus:ring-[#000080] focus:outline-none"
		>
			SAVE COLOR
		</button>
	</form>
</div>
