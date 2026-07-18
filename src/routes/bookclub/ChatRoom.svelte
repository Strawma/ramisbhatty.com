<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import {
		loadAudioPreferences,
		saveAudioPreferences
	} from '$lib/components/bookclub/audio-preferences';

	type Message = {
		id: string;
		memberId: string;
		memberName: string;
		memberColor: string;
		memberColorNeedsOutline: boolean;
		body: string;
		createdAt: string;
		isOwn: boolean;
		isAnnouncement: boolean;
		isDeleted: boolean;
	};

	type Member = {
		id: string;
		name: string;
		isOwn: boolean;
		isOnline: boolean;
	};

	type ChatState = {
		messages: Message[];
		members: Member[];
	};

	let {
		messages,
		members,
		isAdmin
	}: {
		messages: Message[];
		members: Member[];
		isAdmin: boolean;
	} = $props();
	let polledState = $state<ChatState | null>(null);
	let visibleMessages = $derived(polledState?.messages ?? messages);
	let visibleMembers = $derived(polledState?.members ?? members);
	let onlineMemberCount = $derived(visibleMembers.filter((member) => member.isOnline).length);
	let soundsEnabled = $state(false);
	let soundUnavailable = $state(false);
	let audioContext: AudioContext | null = null;
	let messageList = $state<HTMLDivElement | null>(null);
	let stickToBottom = $state(true);
	let hasSeenMessages = false;
	let hasInitialisedScroll = false;
	const seenMessageIds = new SvelteSet<string>();
	const previousOnlineMemberIds = new SvelteSet<string>();
	let hasSeenPresence = false;

	onMount(() => {
		soundsEnabled = loadAudioPreferences().soundsEnabled;

		const activateSounds = () => {
			if (!soundsEnabled || audioContext?.state === 'running') return;

			try {
				const context = getAudioContext();
				void context.resume().catch(() => {
					soundsEnabled = false;
					soundUnavailable = true;
					savePreferences();
				});
			} catch {
				soundsEnabled = false;
				soundUnavailable = true;
				savePreferences();
			}
		};

		window.addEventListener('pointerdown', activateSounds);
		window.addEventListener('keydown', activateSounds);

		return () => {
			window.removeEventListener('pointerdown', activateSounds);
			window.removeEventListener('keydown', activateSounds);
			audioContext?.close();
			audioContext = null;
		};
	});

	$effect(() => {
		void Promise.resolve(visibleMessages).then(() => {
			if (!messageList || (!stickToBottom && hasInitialisedScroll)) return;

			messageList.scrollTop = messageList.scrollHeight;
			hasInitialisedScroll = true;
		});
	});

	async function refreshMessages(): Promise<void> {
		try {
			const response = await fetch('/bookclub/chat', {
				headers: { accept: 'application/json' },
				credentials: 'same-origin'
			});

			if (response.ok) polledState = (await response.json()) as ChatState;
		} catch {
			// Keep the last successful chat state when a poll fails.
		}
	}

	$effect(() => {
		const interval = window.setInterval(() => {
			void refreshMessages();
		}, 5000);

		return () => window.clearInterval(interval);
	});

	$effect(() => {
		const currentMembers = visibleMembers;
		const currentOnlineMemberIds = new Set(
			currentMembers.filter((member) => member.isOnline).map((member) => member.id)
		);

		if (!hasSeenPresence) {
			hasSeenPresence = true;
		} else if (soundsEnabled) {
			for (const member of currentMembers) {
				if (member.isOnline && !member.isOwn && !previousOnlineMemberIds.has(member.id)) {
					playMemberOnlineSound();
				}
			}
		}

		previousOnlineMemberIds.clear();
		for (const memberId of currentOnlineMemberIds) previousOnlineMemberIds.add(memberId);
	});

	$effect(() => {
		const currentMessages = visibleMessages;
		const newMessages = currentMessages.filter((message) => !seenMessageIds.has(message.id));

		for (const message of currentMessages) seenMessageIds.add(message.id);

		if (!hasSeenMessages) {
			hasSeenMessages = true;
			return;
		}

		if (soundsEnabled) {
			for (const message of newMessages) {
				if (!message.isOwn) playMessageSound(message);
			}
		}
	});

	function getAudioContext(): AudioContext {
		return (audioContext ??= new AudioContext());
	}

	function savePreferences(): void {
		const preferences = loadAudioPreferences();
		saveAudioPreferences({
			soundsEnabled,
			musicEnabled: preferences.musicEnabled,
			musicVolume: preferences.musicVolume
		});
	}

	function playTone(
		frequency: number,
		duration: number,
		delay: number,
		type: OscillatorType
	): void {
		if (!audioContext || audioContext.state !== 'running') return;

		const start = audioContext.currentTime + delay;
		const oscillator = audioContext.createOscillator();
		const gain = audioContext.createGain();
		oscillator.type = type;
		oscillator.frequency.setValueAtTime(frequency, start);
		gain.gain.setValueAtTime(0.0001, start);
		gain.gain.exponentialRampToValueAtTime(0.09, start + 0.01);
		gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
		oscillator.connect(gain).connect(audioContext.destination);
		oscillator.start(start);
		oscillator.stop(start + duration + 0.02);
	}

	function playMessageSound(message: Message): void {
		if (message.isAnnouncement) {
			if (message.body.startsWith('MEMBER REMOVED:')) {
				playTone(240, 0.12, 0, 'sawtooth');
				playTone(150, 0.2, 0.12, 'sawtooth');
				return;
			}

			playTone(520, 0.1, 0, 'triangle');
			playTone(780, 0.16, 0.1, 'triangle');
			return;
		}

		playTone(660, 0.12, 0, 'sine');
	}

	function playMemberOnlineSound(): void {
		playTone(740, 0.08, 0, 'sine');
		playTone(1040, 0.14, 0.08, 'sine');
	}

	async function toggleSounds(): Promise<void> {
		if (soundsEnabled) {
			soundsEnabled = false;
			savePreferences();
			return;
		}

		try {
			const context = getAudioContext();
			if (context.state === 'suspended') await context.resume();
			soundsEnabled = true;
			soundUnavailable = false;
			savePreferences();
			if (soundsEnabled) playTone(660, 0.12, 0, 'sine');
		} catch {
			soundsEnabled = false;
			soundUnavailable = true;
			savePreferences();
		}
	}

	function updateScrollPosition(): void {
		if (!messageList) return;
		stickToBottom =
			messageList.scrollHeight - messageList.scrollTop - messageList.clientHeight < 32;
	}

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

<section
	id="chatroom"
	aria-label="Book club chatroom"
	class="border-4 border-black bg-[#d4d0c8] shadow-[4px_4px_0_#000]"
>
	<div class="flex min-h-56 flex-col p-3">
		<div class="mb-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-gray-600">
			<span>Incoming messages and new arrivals use browser-generated tones.</span>
			<button
				type="button"
				onclick={toggleSounds}
				class="border-2 border-black bg-[#d4d0c8] px-2 py-1 font-bold text-black hover:bg-white focus:ring-2 focus:ring-[#000080] focus:outline-none"
				aria-pressed={soundsEnabled}
			>
				{soundsEnabled ? 'SOUNDS: ON' : 'SOUNDS: OFF'}
			</button>
		</div>
		{#if soundUnavailable}
			<p
				class="mb-3 border-2 border-black bg-[#fff0f0] px-2 py-1 text-[10px] text-[#800000]"
				role="status"
			>
				Browser audio is unavailable.
			</p>
		{/if}
		<div
			aria-live="polite"
			bind:this={messageList}
			onscroll={updateScrollPosition}
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
							<span
								style:color={message.memberColor}
								class:chat-name-outline={message.memberColorNeedsOutline}
								class="min-w-0 truncate font-bold"
								title={message.memberName}>{message.memberName}:</span
							>
							<span
								class:text-gray-500={message.isDeleted}
								class:italic={message.isDeleted}
								class="col-span-3 row-start-2 min-w-0 break-words sm:col-span-1 sm:row-auto"
								>{message.body}</span
							>
						{/if}
						{#if !message.isAnnouncement && !message.isDeleted && (isAdmin || message.isOwn)}
							<form
								method="POST"
								action={isAdmin ? '?/deleteMessage' : '?/deleteOwnMessage'}
								use:enhance
								class="col-start-3 row-start-1 ml-auto shrink-0 sm:col-auto sm:row-auto"
							>
								<input type="hidden" name="messageId" value={message.id} />
								<button
									type="submit"
									aria-label={isAdmin ? 'Tombstone message as admin' : 'Tombstone your message'}
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
		<div class="mt-3 border-2 border-black bg-[#c0c0c0] p-2 text-[10px] text-black">
			<div class="mb-2 flex items-center justify-between gap-2 font-bold text-[#000080]">
				<h3>CLUB MEMBERS</h3>
				<span>{onlineMemberCount}/{visibleMembers.length} ONLINE</span>
			</div>
			<ul
				class="grid max-h-28 gap-1 overflow-y-auto border-2 border-black bg-white p-2 sm:grid-cols-2"
			>
				{#each visibleMembers as member (member.id)}
					<li class="flex min-w-0 items-center gap-2">
						<span
							class:bg-green-600={member.isOnline}
							class:bg-red-700={!member.isOnline}
							class="h-2 w-2 shrink-0 rounded-full border border-black"
							aria-hidden="true"
						></span>
						<span class="min-w-0 truncate font-bold" title={member.name}
							>{member.name}{member.isOwn ? ' (YOU)' : ''}</span
						>
						<span class="ml-auto shrink-0 text-gray-600"
							>{member.isOnline ? 'ONLINE' : 'OFFLINE'}</span
						>
					</li>
				{/each}
			</ul>
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
		<p class="mt-2 text-right text-[10px] text-gray-600">
			Refreshes every 5 seconds while visible.
		</p>
	</div>
</section>

<style>
	.chat-name-outline {
		text-shadow:
			0 0 1px white,
			0 0 3px rgb(255 255 255 / 0.85);
	}
</style>
