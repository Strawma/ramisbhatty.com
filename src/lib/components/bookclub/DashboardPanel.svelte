<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { DashboardPanelId } from './dashboard-preferences';

	let {
		panelId,
		title,
		position,
		total,
		collapsed,
		wide = false,
		tray = false,
		onToggleCollapsed,
		onMove,
		onDragStart,
		onDragOver,
		onDrop,
		onDragEnd,
		children
	}: {
		panelId: DashboardPanelId;
		title: string;
		position: number;
		total: number;
		collapsed: boolean;
		wide?: boolean;
		tray?: boolean;
		onToggleCollapsed: () => void;
		onMove: (direction: -1 | 1) => void;
		onDragStart: (event: DragEvent) => void;
		onDragOver: (event: DragEvent) => void;
		onDrop: (event: DragEvent) => void;
		onDragEnd: () => void;
		children: Snippet;
	} = $props();

	function handlePanelDragStart(event: DragEvent): void {
		if (
			event.target instanceof Element &&
			event.target.closest('button, input, textarea, select, a, [contenteditable="true"]')
		) {
			event.preventDefault();
			return;
		}

		onDragStart(event);
	}
</script>

<div
	role="group"
	id={tray ? panelId : undefined}
	draggable="true"
	class="min-w-0 {wide && !tray ? 'lg:col-span-2' : ''}"
	style:order={position}
	ondragover={onDragOver}
	ondrop={onDrop}
	ondragstart={handlePanelDragStart}
	ondragend={onDragEnd}
>
	<div
		role="toolbar"
		aria-label={`${title} panel controls`}
		class="flex min-h-8 items-center gap-1 border-4 border-black {tray
			? ''
			: 'border-b-0'} bg-[#808080] px-2 py-1 text-xs text-white"
	>
		<span class="mr-auto truncate font-bold">{title}</span>
		<span
			class="cursor-grab border-2 border-black bg-[#c0c0c0] px-2 py-0.5 font-bold text-black active:cursor-grabbing"
			aria-hidden="true"
			title="Drag this panel"
		>
			=
		</span>
		<button
			type="button"
			disabled={position === 0}
			onclick={() => onMove(-1)}
			class="border-2 border-black bg-[#c0c0c0] px-2 py-0.5 font-bold text-black hover:bg-white focus:ring-2 focus:ring-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
			aria-label={`Move ${title} panel up`}
			title="Move panel up"
		>
			^
		</button>
		<button
			type="button"
			disabled={position === total - 1}
			onclick={() => onMove(1)}
			class="border-2 border-black bg-[#c0c0c0] px-2 py-0.5 font-bold text-black hover:bg-white focus:ring-2 focus:ring-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
			aria-label={`Move ${title} panel down`}
			title="Move panel down"
		>
			v
		</button>
		<button
			type="button"
			onclick={onToggleCollapsed}
			class="border-2 border-black bg-[#c0c0c0] px-2 py-0.5 font-bold text-black hover:bg-white focus:ring-2 focus:ring-white focus:outline-none"
			aria-expanded={!collapsed}
			aria-controls={tray ? undefined : `${panelId}-panel`}
			aria-label={collapsed ? `Open ${title} panel` : `Collapse ${title} panel`}
			title={collapsed ? 'Open panel' : 'Collapse panel'}
		>
			<span aria-hidden="true">{collapsed ? '+' : '-'}</span>
		</button>
	</div>

	{#if tray}
		<!-- The window bar is the tray item; its content stays mounted only in the main grid. -->
	{:else if collapsed}
		<div
			id={`${panelId}-panel`}
			class="border-4 border-dashed border-black bg-[#d4d0c8] p-4 text-xs text-gray-700"
		>
			{title} PANEL COLLAPSED.
		</div>
	{:else}
		<div id={`${panelId}-panel`}>
			{@render children()}
		</div>
	{/if}
</div>
