<script lang="ts">
	import { enhance } from '$app/forms';

	type Message = {
		id: string;
		memberId: string;
		memberName: string;
		body: string;
		createdAt: string;
		isOwn: boolean;
		isAnnouncement: boolean;
	};

	let { messages, isAdmin }: { messages: Message[]; isAdmin: boolean } = $props();
	let polledMessages = $state<Message[] | null>(null);
	let visibleMessages = $derived(polledMessages ?? messages);
	let isOpen = $state(true);

	async function refreshMessages(): Promise<void> {
		try {
			const response = await fetch('/bookclub/chat', {
				headers: { accept: 'application/json' },
				credentials: 'same-origin'
			});

			if (response.ok) polledMessages = (await response.json()) as Message[];
		} catch {
			// Keep the last successful chat state when a poll fails.
		}
	}

	$effect(() => {
		if (!isOpen) return;

		const interval = window.setInterval(() => {
			void refreshMessages();
		}, 5000);

		return () => window.clearInterval(interval);
	});

	function formatMessageTime(value: string): string {
		return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	function formatMessageDate(value: string): string {
		return new Date(value).toLocaleDateString([], {
			weekday: 'short',
			month: 'short',
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
		BMBMT IRC // {isOpen ? 'ONLINE' : 'PAUSED'}
	</summary>
	<div class="flex min-h-56 flex-col p-3">
		<div
			aria-live="polite"
			class="flex max-h-72 min-h-40 flex-1 flex-col gap-1 overflow-y-auto border-2 border-black bg-black p-3 font-mono text-xs text-green-400"
		>
			{#if visibleMessages.length === 0}
				<p>&gt; no messages yet. Say something about a book.</p>
			{:else}
				{#each visibleMessages as message, index (message.id)}
					{@const previousMessage = visibleMessages[index - 1]}
					{#if !previousMessage || messageDateKey(previousMessage.createdAt) !== messageDateKey(message.createdAt)}
						<div
							role="separator"
							class="my-2 border-y border-green-800 py-1 text-center text-[10px] font-bold text-green-500 sm:text-xs"
						>
							{formatMessageDate(message.createdAt)}
						</div>
					{/if}
					<div
						class:my-1={message.isAnnouncement}
						class="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-2 gap-y-0.5 sm:grid-cols-[4.5rem_minmax(6rem,8rem)_minmax(0,1fr)_auto] sm:gap-2"
					>
						<time class="shrink-0 text-green-700" datetime={message.createdAt}
							>[{formatMessageTime(message.createdAt)}]</time
						>
						{#if message.isAnnouncement}
							<span class="col-span-2 min-w-0 font-bold break-words text-yellow-300 sm:col-span-2"
								>SYSTEM: {message.body}</span
							>
						{:else}
							<span class="min-w-0 truncate font-bold text-cyan-300" title={message.memberName}
								>{message.memberName}:</span
							>
							<span class="col-span-3 row-start-2 min-w-0 break-words sm:col-span-1 sm:row-auto"
								>{message.body}</span
							>
						{/if}
						{#if isAdmin}
							<form
								method="POST"
								action="?/deleteMessage"
								use:enhance
								class="col-start-3 row-start-1 ml-auto shrink-0 sm:col-auto sm:row-auto"
							>
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
