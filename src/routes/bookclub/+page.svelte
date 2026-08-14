<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import bookclubSystemMessages from '#lib/data/bookclub-system-messages.json';
	import DashboardPanel from '#lib/components/bookclub/DashboardPanel.svelte';
	import ProfileSettings from '#lib/components/bookclub/ProfileSettings.svelte';
	import SuggestionSlot from '#lib/components/bookclub/SuggestionSlot.svelte';
	import {
		completeOrder,
		constrainWindowGeometry,
		createDefaultWindowGeometries,
		loadDashboardPreferences,
		saveDashboardPreferences,
		type DashboardPanelId,
		type DashboardWindowGeometry
	} from '#lib/components/bookclub/dashboard-preferences';
	import ChatRoom from './ChatRoom.svelte';
	import ClubNav from './ClubNav.svelte';

	let { data, form } = $props();
	let timezoneOffset = $state(0);
	let coverFailed = $state(false);
	let systemMessage = $state(bookclubSystemMessages[0] ?? 'Please insert literature.');
	let dashboardOrder = $state<DashboardPanelId[]>(completeOrder([]));
	let collapsedPanels = $state<Partial<Record<DashboardPanelId, boolean>>>({});
	let windowGeometries = $state<Partial<Record<DashboardPanelId, DashboardWindowGeometry>>>({});
	let windowStack = $state<DashboardPanelId[]>(completeOrder([]));
	let workspaceWidth = $state(900);
	let workspaceReady = $state(false);
	let workspaceElement: HTMLDivElement;
	let layoutSaveFrame: number | null = null;
	let visiblePanelIds = $derived(
		dashboardOrder.filter((panelId) => panelId !== 'admin' || data.member.role === 'admin')
	);
	let activePanelIds = $derived(visiblePanelIds.filter((panelId) => !collapsedPanels[panelId]));
	let collapsedPanelIds = $derived(visiblePanelIds.filter((panelId) => collapsedPanels[panelId]));
	let workspaceHeight = $derived.by(() =>
		Math.max(
			480,
			...activePanelIds.map((panelId) => {
				const geometry = getWindowGeometry(panelId);
				return geometry.y + geometry.height + 16;
			})
		)
	);

	onMount(() => {
		timezoneOffset = new Date().getTimezoneOffset();
		const preferences = loadDashboardPreferences();
		dashboardOrder = preferences.order;
		collapsedPanels = preferences.collapsed;
		windowGeometries = preferences.windows;
		windowStack = preferences.zOrder;
		systemMessage =
			bookclubSystemMessages[Math.floor(Math.random() * bookclubSystemMessages.length)] ??
			systemMessage;

		const resizeObserver = new ResizeObserver(([entry]) => {
			const nextWidth = Math.max(280, Math.floor(entry.contentRect.width));
			if (
				nextWidth === workspaceWidth &&
				completeOrder([]).every((panelId) => windowGeometries[panelId])
			) {
				return;
			}
			const defaults = createDefaultWindowGeometries(nextWidth);
			const nextGeometries: Partial<Record<DashboardPanelId, DashboardWindowGeometry>> = {};
			for (const panelId of completeOrder([])) {
				nextGeometries[panelId] = constrainWindowGeometry(
					windowGeometries[panelId] ?? defaults[panelId],
					nextWidth
				);
			}
			workspaceWidth = nextWidth;
			windowGeometries = nextGeometries;
			scheduleDashboardLayoutSave();
		});
		resizeObserver.observe(workspaceElement);
		workspaceReady = true;
		return () => {
			resizeObserver.disconnect();
			if (layoutSaveFrame !== null) cancelAnimationFrame(layoutSaveFrame);
			layoutSaveFrame = null;
		};
	});

	function saveDashboardLayout(): void {
		if (layoutSaveFrame !== null) {
			cancelAnimationFrame(layoutSaveFrame);
			layoutSaveFrame = null;
		}

		saveDashboardPreferences({
			order: dashboardOrder,
			collapsed: collapsedPanels,
			windows: windowGeometries,
			zOrder: windowStack
		});
	}

	function scheduleDashboardLayoutSave(): void {
		if (layoutSaveFrame !== null) return;

		layoutSaveFrame = requestAnimationFrame(() => {
			layoutSaveFrame = null;
			saveDashboardLayout();
		});
	}

	function togglePanel(panelId: DashboardPanelId): void {
		collapsedPanels = { ...collapsedPanels, [panelId]: !collapsedPanels[panelId] };
		if (!collapsedPanels[panelId]) bringWindowToFront(panelId, false);
		saveDashboardLayout();
	}

	function movePanel(panelId: DashboardPanelId, direction: -1 | 1): void {
		const currentIndex = visiblePanelIds.indexOf(panelId);
		const targetPanelId = visiblePanelIds[currentIndex + direction];
		if (!targetPanelId) return;

		const nextOrder = [...dashboardOrder];
		const panelIndex = nextOrder.indexOf(panelId);
		const targetIndex = nextOrder.indexOf(targetPanelId);
		[nextOrder[panelIndex], nextOrder[targetIndex]] = [
			nextOrder[targetIndex],
			nextOrder[panelIndex]
		];
		dashboardOrder = nextOrder;
		saveDashboardLayout();
	}

	function resetDashboardLayout(): void {
		dashboardOrder = completeOrder([]);
		collapsedPanels = {};
		windowGeometries = createDefaultWindowGeometries(workspaceWidth);
		windowStack = completeOrder([]);
		saveDashboardLayout();
	}

	function getWindowGeometry(panelId: DashboardPanelId): DashboardWindowGeometry {
		return constrainWindowGeometry(
			windowGeometries[panelId] ?? createDefaultWindowGeometries(workspaceWidth)[panelId],
			workspaceWidth
		);
	}

	function updateWindowGeometry(
		panelId: DashboardPanelId,
		geometry: DashboardWindowGeometry
	): void {
		windowGeometries = {
			...windowGeometries,
			[panelId]: constrainWindowGeometry(geometry, workspaceWidth)
		};
		saveDashboardLayout();
	}

	function bringWindowToFront(panelId: DashboardPanelId, save = true): void {
		if (windowStack.at(-1) === panelId) return;
		windowStack = [...windowStack.filter((id) => id !== panelId), panelId];
		if (save) saveDashboardLayout();
	}

	function getWindowZIndex(panelId: DashboardPanelId): number {
		return Math.max(1, windowStack.indexOf(panelId) + 1);
	}

	function formatMeetingDate(value: string): string {
		return new Date(value).toLocaleString([], {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	function formatDateTime(value: string): string {
		return new Date(value).toLocaleString([], {
			dateStyle: 'medium',
			timeStyle: 'short'
		});
	}

	function meetingInputValue(value: string | null): string {
		if (!value) return '';
		const date = new Date(value);
		const offset = date.getTimezoneOffset() * 60000;
		return new Date(date.getTime() - offset).toISOString().slice(0, 16);
	}

	function getClubMorale(): { label: string; detail: string } {
		const submitted = data.dashboard.suggestionProgress.reduce(
			(total, progress) => total + progress.count,
			0
		);

		if (data.dashboard.activeCycle) {
			return {
				label: 'SUGGESTION FRENZY',
				detail: `${submitted} literary ticket${submitted === 1 ? '' : 's'} submitted.`
			};
		}

		if (data.dashboard.drawReadyCycle) {
			return { label: 'DRAW FEVER', detail: 'The book machine is warmed up.' };
		}

		if (data.dashboard.currentBook && data.dashboard.nextMeeting) {
			return { label: 'FULLY BOOKED', detail: 'A book and a social appointment. Excellent.' };
		}

		if (data.dashboard.currentBook) {
			return { label: 'READING QUIETLY', detail: 'The current book is doing most of the work.' };
		}

		return { label: 'AWAITING LITERATURE', detail: 'Morale will improve when a book appears.' };
	}

	function formatBuildTimestamp(value: string): string {
		return new Date(value).toLocaleString([], {
			dateStyle: 'medium',
			timeStyle: 'short'
		});
	}
</script>

<svelte:head>
	<title>Bournemouth Mini Book Meet Thing (Working Title) | Ramis Bhatty</title>
	<meta name="description" content="A private reading group for friends." />
</svelte:head>

<main class="relative min-h-screen p-2 font-mono text-sm text-black sm:p-4">
	<div
		class="relative z-10 mx-auto max-w-7xl border-4 border-black bg-[#d4d0c8] shadow-[6px_6px_0_#000]"
	>
		<header
			class="flex flex-wrap items-center justify-between gap-2 border-b-4 border-black bg-[#000080] px-3 py-2 font-bold text-white"
		>
			<h1>BMBMT // WORKING TITLE</h1>
			<p class="text-xs text-cyan-200">CONNECTION: SECURE / SESSION: ACTIVE</p>
		</header>

		<div class="md:flex">
			<ClubNav member={data.member} />

			<div class="min-w-0 flex-1 bg-[#008080] p-3 sm:p-5">
				<section id="clubhouse" class="border-4 border-black bg-[#d4d0c8] shadow-[4px_4px_0_#000]">
					<div class="border-b-2 border-black bg-[#808080] px-3 py-2 font-bold text-white">
						WELCOME TO THE READING ZONE
					</div>
					<div class="p-4 sm:p-5">
						<p class="text-xs font-bold text-[#000080] uppercase">Club bulletin</p>
						<h2 class="mt-2 text-2xl font-black sm:text-4xl">Hello, {data.member.name}.</h2>
						{#if form?.error || form?.success}
							<p
								class:text-green-700={form?.success}
								class="mt-3 border-2 border-black bg-white px-3 py-2 font-bold text-[#800000]"
								role={form?.error ? 'alert' : 'status'}
							>
								{form.error ?? form.success}
							</p>
						{/if}
						<p class="mt-3 max-w-3xl leading-6">
							Welcome to the Bournemouth Mini Book Meet Thing (Working Title). The shelves are still
							being arranged, but the extremely serious reading operations can begin here.
						</p>
						<div class="mt-4 grid gap-2 sm:grid-cols-3">
							<div class="border-2 border-black bg-white p-3">
								<p class="text-xs font-bold text-[#000080]">CURRENT BOOK</p>
								<p class="mt-2 font-bold">
									{data.dashboard.currentBook?.title ?? 'No book selected yet.'}
								</p>
							</div>
							<div class="border-2 border-black bg-white p-3">
								<p class="text-xs font-bold text-[#000080]">CLUB MORALE</p>
								<p class="mt-2 font-bold text-green-700">{getClubMorale().label}</p>
								<p class="mt-1 text-xs">{getClubMorale().detail}</p>
							</div>
							<div class="border-2 border-black bg-white p-3">
								<p class="text-xs font-bold text-[#000080]">SYSTEM MESSAGE</p>
								<p class="mt-2 font-bold">{systemMessage}</p>
							</div>
						</div>
						<div class="mt-4 border-2 border-black bg-[#ffffcc] p-3">
							<p class="text-xs font-bold text-[#800000]">NEXT MEETING</p>
							{#if data.dashboard.nextMeeting}
								<p class="mt-2 font-bold">
									{formatMeetingDate(data.dashboard.nextMeeting.scheduledFor)}
								</p>
								{#if data.dashboard.nextMeeting.note}
									<p class="mt-1 text-xs">{data.dashboard.nextMeeting.note}</p>
								{/if}
							{:else}
								<p class="mt-2 font-bold">No meeting scheduled.</p>
							{/if}
						</div>
					</div>
				</section>

				<div class="mt-5 border-2 border-black bg-[#c0c0c0] p-2 text-xs">
					<div class="flex flex-wrap items-center justify-between gap-2">
						<div>
							<p class="font-bold text-[#000080]">WINDOW WORKSPACE</p>
							<p class="mt-1">
								On desktop, drag window bars and resize from the lower-right corner. On mobile, use
								the move buttons. Scroll over a window to move the page; chat, member, and archive
								lists keep their own scrolling. Layout is saved in this browser.
							</p>
						</div>
						<button
							type="button"
							onclick={resetDashboardLayout}
							class="border-2 border-black bg-[#d4d0c8] px-2 py-1 font-bold shadow-[2px_2px_0_#000] hover:bg-white focus:ring-2 focus:ring-[#000080] focus:outline-none"
						>
							RESET LAYOUT
						</button>
					</div>
				</div>

				{#snippet renderDashboardPanel(panelId: DashboardPanelId, inTray: boolean)}
					{#if panelId === 'current-book'}
						<DashboardPanel
							panelId="current-book"
							title="CURRENT BOOK"
							position={dashboardOrder.indexOf(panelId)}
							total={visiblePanelIds.length}
							collapsed={inTray}
							tray={inTray}
							geometry={getWindowGeometry('current-book')}
							{workspaceWidth}
							zIndex={getWindowZIndex('current-book')}
							onToggleCollapsed={() => togglePanel('current-book')}
							onMove={(direction) => movePanel('current-book', direction)}
							onFocus={() => bringWindowToFront('current-book')}
							onGeometryChange={(geometry) => updateWindowGeometry('current-book', geometry)}
						>
							<section
								id="current-book"
								class="border-4 border-black bg-[#d4d0c8] shadow-[4px_4px_0_#000]"
							>
								<div class="border-b-2 border-black bg-[#000080] px-3 py-2 font-bold text-white">
									CURRENT BOOK // {data.dashboard.currentBook ? 'ACTIVE' : 'NOT CONFIGURED'}
								</div>
								<div class="grid gap-4 p-4 sm:grid-cols-[140px_1fr] sm:p-5">
									{#if data.dashboard.currentBook?.coverUrl && !coverFailed}
										<div class="border-2 border-black bg-white p-2">
											<img
												src={data.dashboard.currentBook.coverUrl}
												alt={`Cover of ${data.dashboard.currentBook.title}`}
												class="mx-auto max-h-64 w-full object-contain"
												onerror={() => (coverFailed = true)}
											/>
											<p class="mt-2 text-center text-[10px] text-gray-600">
												Cover via <a
													href="https://openlibrary.org"
													target="_blank"
													rel="noreferrer"
													class="underline">Open Library</a
												>.
											</p>
										</div>
									{:else}
										<div
											class="flex min-h-44 items-center justify-center border-2 border-black bg-white p-3 text-center text-xs"
										>
											COVER IMAGE
											<br />NOT FOUND
										</div>
									{/if}
									<div>
										<p class="text-xs font-bold text-[#000080] uppercase">
											{#if data.dashboard.currentBook?.startedAt}
												Current book started {formatDateTime(data.dashboard.currentBook.startedAt)}
											{:else}
												No book has been drawn yet.
											{/if}
										</p>
										<h2 class="mt-2 text-2xl font-black">
											{data.dashboard.currentBook?.title ?? 'The next book is classified.'}
										</h2>
										<p class="mt-3 leading-6">
											{#if data.dashboard.currentBook}
												By {data.dashboard.currentBook.author}. More stuff will appear here when I
												can be bothered to implement it.
												{#if data.dashboard.currentBook.completedAt}
													Book completed {formatDateTime(data.dashboard.currentBook.completedAt)}.
												{/if}
											{:else}
												Once an admin runs the draw, this panel will show the winning book and
												author.
											{/if}
										</p>
										{#if data.dashboard.currentCycle}
											<a
												href={resolve(`bookclub/draw/${data.dashboard.currentCycle.id}`)}
												class="mt-4 inline-block border-2 border-black bg-[#ffffcc] px-3 py-2 font-bold underline shadow-[2px_2px_0_#000] hover:bg-white focus:ring-2 focus:ring-[#000080] focus:outline-none"
											>
												REPLAY DRAW &gt;
											</a>
										{/if}
									</div>
								</div>
							</section>
						</DashboardPanel>
					{:else if panelId === 'suggestions'}
						<DashboardPanel
							panelId="suggestions"
							title="SUGGESTIONS"
							position={dashboardOrder.indexOf(panelId)}
							total={visiblePanelIds.length}
							collapsed={inTray}
							tray={inTray}
							geometry={getWindowGeometry('suggestions')}
							{workspaceWidth}
							zIndex={getWindowZIndex('suggestions')}
							onToggleCollapsed={() => togglePanel('suggestions')}
							onMove={(direction) => movePanel('suggestions', direction)}
							onFocus={() => bringWindowToFront('suggestions')}
							onGeometryChange={(geometry) => updateWindowGeometry('suggestions', geometry)}
						>
							<section
								id="suggestions"
								class="border-4 border-black bg-[#d4d0c8] shadow-[4px_4px_0_#000]"
							>
								<div class="border-b-2 border-black bg-[#800080] px-3 py-2 font-bold text-white">
									SUGGESTION BOX // {data.dashboard.mySuggestions.length} OF {data.dashboard
										.activeCycle?.suggestionLimit ?? 3} USED
								</div>
								<div class="space-y-2 p-4">
									<p class="leading-6">
										{data.dashboard.activeCycle
											? 'Submit up to three different books before the poll closes. Books that are not chosen will stay in their slots for the next poll.'
											: 'No book poll is open. Await further literary instructions.'}
									</p>
									{#each [1, 2, 3] as slot (slot)}
										<SuggestionSlot
											{slot}
											active={Boolean(data.dashboard.activeCycle)}
											suggestion={data.dashboard.mySuggestions.find(
												(suggestion) => suggestion.position === slot
											)}
										/>
									{/each}
									{#if data.dashboard.activeCycle}
										<div class="mt-4 border-2 border-black bg-black p-3 text-xs text-lime-300">
											<p class="font-bold text-white">MEMBER PROGRESS</p>
											{#each data.dashboard.suggestionProgress as progress (progress.memberId)}
												<p class="mt-1">{progress.memberName}: {progress.count}/3 tickets</p>
											{/each}
										</div>
									{/if}
								</div>
							</section>
						</DashboardPanel>
					{:else if panelId === 'chatroom'}
						<DashboardPanel
							panelId="chatroom"
							title="CHATROOM"
							position={dashboardOrder.indexOf(panelId)}
							total={visiblePanelIds.length}
							collapsed={inTray}
							tray={inTray}
							geometry={getWindowGeometry('chatroom')}
							{workspaceWidth}
							zIndex={getWindowZIndex('chatroom')}
							onToggleCollapsed={() => togglePanel('chatroom')}
							onMove={(direction) => movePanel('chatroom', direction)}
							onFocus={() => bringWindowToFront('chatroom')}
							onGeometryChange={(geometry) => updateWindowGeometry('chatroom', geometry)}
						>
							<ChatRoom
								messages={data.dashboard.chatMessages}
								members={data.dashboard.chatMembers}
								isAdmin={data.member.role === 'admin'}
							/>
						</DashboardPanel>
					{:else if panelId === 'archive'}
						<DashboardPanel
							panelId="archive"
							title="ARCHIVE"
							position={dashboardOrder.indexOf(panelId)}
							total={visiblePanelIds.length}
							collapsed={inTray}
							tray={inTray}
							geometry={getWindowGeometry('archive')}
							{workspaceWidth}
							zIndex={getWindowZIndex('archive')}
							onToggleCollapsed={() => togglePanel('archive')}
							onMove={(direction) => movePanel('archive', direction)}
							onFocus={() => bringWindowToFront('archive')}
							onGeometryChange={(geometry) => updateWindowGeometry('archive', geometry)}
						>
							<section
								id="archive"
								class="border-4 border-black bg-[#d4d0c8] shadow-[4px_4px_0_#000]"
							>
								<div class="border-b-2 border-black bg-[#808080] px-3 py-2 font-bold text-white">
									ARCHIVE // {data.dashboard.archive.length} PAST BOOK{data.dashboard.archive
										.length === 1
										? ''
										: 'S'}
								</div>
								<div class="p-4">
									{#if data.dashboard.archive.length > 0}
										<p class="mb-3 text-xs leading-5">
											The shelves remember previous selections. Open a book to inspect its record.
										</p>
										<div
											data-inner-scroll
											class="max-h-64 space-y-2 overflow-y-auto border-2 border-black bg-white p-2"
										>
											{#each data.dashboard.archive as entry (entry.id)}
												<a
													href={resolve(`bookclub/archive/${entry.id}`)}
													class="block border-2 border-black bg-[#ffffcc] p-3 hover:bg-white focus:ring-2 focus:ring-[#000080] focus:outline-none"
												>
													<div class="flex flex-wrap items-start justify-between gap-2">
														<div>
															<p class="text-xs font-bold text-[#000080] uppercase">
																{formatDateTime(entry.openedAt)}
															</p>
															<p class="mt-1 font-bold">{entry.book.title}</p>
															<p class="text-xs">by {entry.book.author}</p>
														</div>
														<span class="text-xs font-bold underline">OPEN &gt;</span>
													</div>
													<p class="mt-2 text-[10px] text-gray-600">
														{entry.reviewCount} review{entry.reviewCount === 1 ? '' : 's'} ready for later.
													</p>
												</a>
											{/each}
										</div>
									{:else}
										<p class="leading-6">
											Past books will appear here once a newer book has been drawn.
										</p>
									{/if}
								</div>
							</section>
						</DashboardPanel>
					{:else if panelId === 'profile'}
						<DashboardPanel
							panelId="profile"
							title="PROFILE"
							position={dashboardOrder.indexOf(panelId)}
							total={visiblePanelIds.length}
							collapsed={inTray}
							tray={inTray}
							geometry={getWindowGeometry('profile')}
							{workspaceWidth}
							zIndex={getWindowZIndex('profile')}
							onToggleCollapsed={() => togglePanel('profile')}
							onMove={(direction) => movePanel('profile', direction)}
							onFocus={() => bringWindowToFront('profile')}
							onGeometryChange={(geometry) => updateWindowGeometry('profile', geometry)}
						>
							<section
								id="profile"
								class="border-4 border-black bg-[#d4d0c8] shadow-[4px_4px_0_#000]"
							>
								<div class="border-b-2 border-black bg-[#008080] px-3 py-2 font-bold text-white">
									PROFILE // CLUB IDENTITY
								</div>
								<ProfileSettings member={data.member} />
							</section>
						</DashboardPanel>
					{:else if panelId === 'admin' && data.member.role === 'admin'}
						<DashboardPanel
							panelId="admin"
							title="ADMIN CONSOLE"
							position={dashboardOrder.indexOf(panelId)}
							total={visiblePanelIds.length}
							collapsed={inTray}
							tray={inTray}
							geometry={getWindowGeometry('admin')}
							{workspaceWidth}
							zIndex={getWindowZIndex('admin')}
							onToggleCollapsed={() => togglePanel('admin')}
							onMove={(direction) => movePanel('admin', direction)}
							onFocus={() => bringWindowToFront('admin')}
							onGeometryChange={(geometry) => updateWindowGeometry('admin', geometry)}
						>
							<section
								id="admin"
								class="border-4 border-black bg-[#d4d0c8] shadow-[4px_4px_0_#000]"
							>
								<div class="border-b-2 border-black bg-[#800000] px-3 py-2 font-bold text-white">
									ADMIN CONSOLE // AVAILABLE
								</div>
								<div class="space-y-4 p-4">
									{#if data.dashboard.activeCycle}
										<div class="border-2 border-black bg-white p-3">
											<p class="font-bold">BOOK POLL OPEN</p>
											<p class="mt-1 text-xs">
												Opened {formatDateTime(data.dashboard.activeCycle.openedAt)}. The current
												book stays active until the next draw.
											</p>
											<p class="mt-1 text-xs">
												{data.dashboard.suggestionProgress.reduce(
													(total, item) => total + item.count,
													0
												)} tickets submitted.
											</p>
											<form method="POST" action="?/closeCycle" use:enhance class="mt-3">
												<button
													type="submit"
													class="border-2 border-black bg-[#d4d0c8] px-3 py-2 font-bold shadow-[2px_2px_0_#000] hover:bg-white"
												>
													CLOSE BOOK POLL
												</button>
											</form>
										</div>
									{:else if data.dashboard.drawReadyCycle}
										<div class="border-2 border-black bg-white p-3">
											<p class="font-bold">BOOK POLL CLOSED</p>
											<p class="mt-1 text-xs">
												Closed {formatDateTime(
													data.dashboard.drawReadyCycle.closedAt ??
														data.dashboard.drawReadyCycle.openedAt
												)}.
											</p>
											<p class="mt-1 text-xs">
												{data.dashboard.suggestionProgress.reduce(
													(total, item) => total + item.count,
													0
												)} tickets submitted. The suggestion pool is locked. This draw cannot be rerun.
											</p>
											<form method="POST" action="?/draw" use:enhance class="mt-3">
												<button
													type="submit"
													class="border-2 border-black bg-[#d4d0c8] px-3 py-2 font-bold shadow-[2px_2px_0_#000] hover:bg-white"
												>
													SPIN NEXT BOOK
												</button>
											</form>
										</div>
									{:else}
										<div class="border-2 border-black bg-white p-3">
											<p class="font-bold">START A NEW BOOK POLL</p>
											<form method="POST" action="?/createCycle" use:enhance class="mt-3">
												<button
													type="submit"
													class="border-2 border-black bg-[#d4d0c8] px-3 py-2 font-bold shadow-[2px_2px_0_#000] hover:bg-white"
												>
													START POLL
												</button>
											</form>
										</div>
									{/if}
									<div class="border-2 border-black bg-[#ffffcc] p-3">
										<p class="font-bold">NEXT MEETING</p>
										{#if data.dashboard.nextMeeting}
											<p class="mt-1 text-xs">
												Currently scheduled for {formatMeetingDate(
													data.dashboard.nextMeeting.scheduledFor
												)}.
											</p>
										{/if}
										<form
											method="POST"
											action="?/scheduleMeeting"
											use:enhance
											class="mt-3 space-y-2"
										>
											<label class="block text-xs font-bold" for="scheduled-for"
												>DATE AND TIME</label
											>
											<input
												id="scheduled-for"
												name="scheduledFor"
												type="datetime-local"
												required
												value={meetingInputValue(data.dashboard.nextMeeting?.scheduledFor ?? null)}
												class="w-full border-2 border-black px-2 py-2 text-xs focus:ring-2 focus:ring-[#000080] focus:outline-none"
											/>
											<input type="hidden" name="timezoneOffset" value={timezoneOffset} />
											<label class="block text-xs font-bold" for="meeting-note"
												>NOTE (OPTIONAL)</label
											>
											<input
												id="meeting-note"
												name="note"
												maxlength="160"
												value={data.dashboard.nextMeeting?.note ?? ''}
												placeholder="e.g. bring snacks"
												class="w-full border-2 border-black px-2 py-2 text-xs focus:ring-2 focus:ring-[#000080] focus:outline-none"
											/>
											<div class="flex flex-wrap gap-2">
												<button
													type="submit"
													class="border-2 border-black bg-[#d4d0c8] px-3 py-2 font-bold shadow-[2px_2px_0_#000] hover:bg-white"
												>
													SCHEDULE
												</button>
												{#if data.dashboard.nextMeeting}
													<button
														type="submit"
														formaction="?/clearMeeting"
														formnovalidate
														class="border-2 border-black bg-[#fff0f0] px-3 py-2 font-bold text-[#800000] shadow-[2px_2px_0_#000] hover:bg-white"
													>
														CLEAR
													</button>
												{/if}
											</div>
										</form>
									</div>
								</div>
							</section>
						</DashboardPanel>
					{/if}
				{/snippet}

				{#if collapsedPanelIds.length > 0}
					<section class="mt-2 border-2 border-black bg-[#c0c0c0] p-2">
						<div
							class="mb-2 flex items-center justify-between gap-2 text-xs font-bold text-[#000080]"
						>
							<span>MINIMIZED WINDOWS</span>
							<span>{collapsedPanelIds.length} STORED</span>
						</div>
						<div class="grid gap-2 sm:grid-cols-2">
							{#each collapsedPanelIds as panelId (panelId)}
								{@render renderDashboardPanel(panelId, true)}
							{/each}
						</div>
					</section>
				{/if}

				<div
					bind:this={workspaceElement}
					data-ready={workspaceReady}
					class="dashboard-workspace mt-2 grid gap-5 lg:relative lg:block"
					style={`--workspace-height: ${workspaceHeight}px;`}
				>
					{#each activePanelIds as panelId (panelId)}
						{@render renderDashboardPanel(panelId, false)}
					{/each}
				</div>
			</div>
		</div>

		<footer class="border-t-4 border-black bg-[#808080] px-3 py-2 text-xs text-white">
			BMBMT // ALL SYSTEMS NOMINALLY OPERATIONAL // LAST BUILD: {formatBuildTimestamp(
				data.buildTimestamp
			)} LOCAL
		</footer>
	</div>
</main>

<style>
	@media (min-width: 1024px) {
		.dashboard-workspace {
			height: var(--workspace-height);
		}
	}
</style>
