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
		onToggleCollapsed: () => void;
		onMove: (direction: -1 | 1) => void;
		onDragStart: (event: DragEvent) => void;
		onDragOver: (event: DragEvent) => void;
		onDrop: (event: DragEvent) => void;
		onDragEnd: () => void;
		children: Snippet;
	} = $props();
</script>

<div
	role="group"
	class="min-w-0 {wide ? 'lg:col-span-2' : ''}"
	style:order={position}
	ondragover={onDragOver}
	ondrop={onDrop}
>
	<div class="mb-1 flex flex-wrap items-center gap-1 text-[10px] text-gray-700">
		<button
			type="button"
			draggable="true"
			ondragstart={onDragStart}
			ondragend={onDragEnd}
			class="cursor-grab border border-black bg-[#c0c0c0] px-1 py-0.5 font-bold hover:bg-white focus:ring-2 focus:ring-[#000080] focus:outline-none active:cursor-grabbing"
			aria-label={`Drag ${title} panel to rearrange it`}
		>
			DRAG
		</button>
		<span class="px-1 font-bold">{title}</span>
		<button
			type="button"
			disabled={position === 0}
			onclick={() => onMove(-1)}
			class="border border-black bg-[#d4d0c8] px-1 py-0.5 font-bold hover:bg-white focus:ring-2 focus:ring-[#000080] focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
			aria-label={`Move ${title} panel up`}
		>
			UP
		</button>
		<button
			type="button"
			disabled={position === total - 1}
			onclick={() => onMove(1)}
			class="border border-black bg-[#d4d0c8] px-1 py-0.5 font-bold hover:bg-white focus:ring-2 focus:ring-[#000080] focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
			aria-label={`Move ${title} panel down`}
		>
			DOWN
		</button>
		<button
			type="button"
			onclick={onToggleCollapsed}
			class="border border-black bg-[#d4d0c8] px-1 py-0.5 font-bold hover:bg-white focus:ring-2 focus:ring-[#000080] focus:outline-none"
			aria-expanded={!collapsed}
			aria-controls={`${panelId}-panel`}
		>
			{collapsed ? 'OPEN' : 'COLLAPSE'}
		</button>
	</div>

	{#if collapsed}
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
