<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';

	type Message = {
		id: string;
		memberId: string;
		memberName: string;
		body: string;
		createdAt: string;
		isOwn: boolean;
	};

	let { messages, isAdmin }: { messages: Message[]; isAdmin: boolean } = $props();
	let isOpen = $state(true);

	$effect(() => {
		if (!isOpen) return;

		const interval = window.setInterval(() => {
			void invalidate('bookclub:chat');
		}, 5000);

		return () => window.clearInterval(interval);
	});

	onMount(() => {
		void invalidate('bookclub:chat');
	});

	function formatMessageTime(value: string): string {
		return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	function formatMessageDate(value: string): string {
		return new Date(value).toLocaleDateString([], {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function messageDateKey(value: string): string {
		return new Date(value).toLocaleDateString();
	}
</script>

<details
	id="chatroom"
	bind:open={isOpen}
	class="border-4 border-black bg-[#d4d0c8] shadow-[4px_4px_0_#000]"
>
	<summary
		class="cursor-pointer border-b-2 border-black bg-[#008080] px-3 py-2 font-bold text-white"
	>
		RAMIS BOOK CLUB IRC // {isOpen ? 'ONLINE' : 'PAUSED'}
	</summary>
	<div class="flex min-h-56 flex-col p-3">
		<div
			aria-live="polite"
			class="flex max-h-72 min-h-40 flex-1 flex-col gap-1 overflow-y-auto border-2 border-black bg-black p-3 font-mono text-xs text-green-400"
		>
			{#if messages.length === 0}
				<p>&gt; no messages yet. Say something about a book.</p>
			{:else}
				{#each messages as message, index (message.id)}
					{@const previousMessage = messages[index - 1]}
					{#if !previousMessage || messageDateKey(previousMessage.createdAt) !== messageDateKey(message.createdAt)}
						<div
							role="separator"
							class="my-2 border-y border-green-800 py-1 text-center font-bold text-green-500"
						>
							{formatMessageDate(message.createdAt)}
						</div>
					{/if}
					<div class="flex gap-2">
						<time class="shrink-0 text-green-700" datetime={message.createdAt}
							>[{formatMessageTime(message.createdAt)}]</time
						>
						<span class="font-bold text-cyan-300">{message.memberName}:</span>
						<span class="min-w-0 break-words">{message.body}</span>
						{#if isAdmin}
							<form method="POST" action="?/deleteMessage" use:enhance class="ml-auto shrink-0">
								<input type="hidden" name="messageId" value={message.id} />
								<button
									type="submit"
									aria-label="Delete message"
									class="text-red-400 underline hover:text-white"
								>
									[x]
								</button>
							</form>
						{/if}
					</div>
				{/each}
			{/if}
		</div>
		<form method="POST" action="?/sendMessage" use:enhance class="mt-3 flex gap-2">
			<label for="chat-message" class="sr-only">Chat message</label>
			<input
				id="chat-message"
				name="body"
				maxlength="500"
				required
				placeholder="type a message..."
				class="min-w-0 flex-1 border-2 border-black bg-white px-2 py-2 text-xs focus:ring-2 focus:ring-[#000080] focus:outline-none"
			/>
			<button
				type="submit"
				class="border-2 border-black bg-[#d4d0c8] px-3 py-2 font-bold shadow-[2px_2px_0_#000] hover:bg-white"
			>
				SEND
			</button>
		</form>
		<p class="mt-2 text-right text-[10px] text-gray-600">Refreshes every 5 seconds while open.</p>
	</div>
</details>
