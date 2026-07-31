<script lang="ts">
	import { onDestroy, untrack, type Snippet } from 'svelte';
	import {
		constrainWindowGeometry,
		type DashboardPanelId,
		type DashboardWindowGeometry
	} from './dashboard-preferences';

	let {
		panelId,
		title,
		position,
		total,
		collapsed,
		tray = false,
		geometry,
		workspaceWidth,
		zIndex,
		onToggleCollapsed,
		onMove,
		onFocus,
		onGeometryChange,
		children
	}: {
		panelId: DashboardPanelId;
		title: string;
		position: number;
		total: number;
		collapsed: boolean;
		tray?: boolean;
		geometry: DashboardWindowGeometry;
		workspaceWidth: number;
		zIndex: number;
		onToggleCollapsed: () => void;
		onMove: (direction: -1 | 1) => void;
		onFocus: () => void;
		onGeometryChange: (geometry: DashboardWindowGeometry) => void;
		children: Snippet;
	} = $props();

	type Interaction = {
		kind: 'drag' | 'resize';
		pointerId: number;
		startX: number;
		startY: number;
		geometry: DashboardWindowGeometry;
	};

	let interaction = $state<Interaction | null>(null);
	let localGeometry = $state<DashboardWindowGeometry>({
		...untrack(() => geometry)
	});

	$effect(() => {
		if (interaction) return;
		localGeometry = { ...geometry };
	});

	function desktopWindowsEnabled(): boolean {
		return typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;
	}

	function startInteraction(kind: Interaction['kind'], event: PointerEvent): void {
		if (tray || !desktopWindowsEnabled()) return;
		if (event.pointerType === 'mouse' && event.buttons !== 1) return;
		if (
			kind === 'drag' &&
			event.target instanceof Element &&
			event.target.closest('button:not([data-drag-handle])')
		) {
			return;
		}

		event.preventDefault();
		event.stopPropagation();
		interaction = {
			kind,
			pointerId: event.pointerId,
			startX: event.clientX,
			startY: event.clientY,
			geometry: { ...localGeometry }
		};
		window.addEventListener('pointermove', continueInteraction, { passive: false });
		window.addEventListener('pointerup', finishInteraction);
		window.addEventListener('pointercancel', finishInteraction);
	}

	function startDragHandle(event: PointerEvent): void {
		event.stopPropagation();
		startInteraction('drag', event);
	}

	function continueInteraction(event: PointerEvent): void {
		if (!interaction || interaction.pointerId !== event.pointerId) return;
		event.preventDefault();
		const deltaX = event.clientX - interaction.startX;
		const deltaY = event.clientY - interaction.startY;

		localGeometry = constrainWindowGeometry(
			interaction.kind === 'drag'
				? {
						x: interaction.geometry.x + deltaX,
						y: interaction.geometry.y + deltaY,
						width: interaction.geometry.width,
						height: interaction.geometry.height
					}
				: {
						x: interaction.geometry.x,
						y: interaction.geometry.y,
						width: interaction.geometry.width + deltaX,
						height: interaction.geometry.height + deltaY
					},
			workspaceWidth
		);
	}

	function finishInteraction(event: PointerEvent): void {
		if (!interaction || interaction.pointerId !== event.pointerId) return;
		const geometryChanged = !sameGeometry(localGeometry, interaction.geometry);
		removeInteractionListeners();
		interaction = null;
		if (geometryChanged) onGeometryChange(localGeometry);
		onFocus();
	}

	function sameGeometry(first: DashboardWindowGeometry, second: DashboardWindowGeometry): boolean {
		return (
			first.x === second.x &&
			first.y === second.y &&
			first.width === second.width &&
			first.height === second.height
		);
	}

	function removeInteractionListeners(): void {
		if (typeof window === 'undefined') return;
		window.removeEventListener('pointermove', continueInteraction);
		window.removeEventListener('pointerup', finishInteraction);
		window.removeEventListener('pointercancel', finishInteraction);
	}

	function moveWithKeyboard(event: KeyboardEvent): void {
		const direction = {
			ArrowLeft: [-1, 0],
			ArrowRight: [1, 0],
			ArrowUp: [0, -1],
			ArrowDown: [0, 1]
		}[event.key];
		if (!direction || !desktopWindowsEnabled()) return;

		event.preventDefault();
		const step = event.shiftKey ? 50 : 10;
		localGeometry = constrainWindowGeometry(
			{
				...localGeometry,
				x: localGeometry.x + direction[0] * step,
				y: localGeometry.y + direction[1] * step
			},
			workspaceWidth
		);
		onGeometryChange(localGeometry);
		onFocus();
	}

	function resizeWithKeyboard(event: KeyboardEvent): void {
		const direction = {
			ArrowLeft: [-1, 0],
			ArrowRight: [1, 0],
			ArrowUp: [0, -1],
			ArrowDown: [0, 1]
		}[event.key];
		if (!direction || !desktopWindowsEnabled()) return;

		event.preventDefault();
		const step = event.shiftKey ? 50 : 10;
		localGeometry = constrainWindowGeometry(
			{
				...localGeometry,
				width: localGeometry.width + direction[0] * step,
				height: localGeometry.height + direction[1] * step
			},
			workspaceWidth
		);
		onGeometryChange(localGeometry);
		onFocus();
	}

	function routeWheelToPage(node: HTMLElement): { destroy: () => void } {
		const handleWheel = (event: WheelEvent) => {
			if (tray || !desktopWindowsEnabled() || event.ctrlKey) return;

			const target = event.target instanceof Element ? event.target : null;
			if (target?.closest('[data-inner-scroll]')) return;

			event.preventDefault();
			const multiplier =
				event.deltaMode === WheelEvent.DOM_DELTA_LINE
					? 16
					: event.deltaMode === WheelEvent.DOM_DELTA_PAGE
						? window.innerHeight
						: 1;
			window.scrollBy({
				top: event.deltaY * multiplier,
				left: event.deltaX * multiplier,
				behavior: 'auto'
			});
		};

		node.addEventListener('wheel', handleWheel, { passive: false });
		return { destroy: () => node.removeEventListener('wheel', handleWheel) };
	}

	onDestroy(removeInteractionListeners);
</script>

<div
	role="group"
	id={tray ? panelId : undefined}
	data-interaction={interaction?.kind}
	class="dashboard-window min-w-0"
	class:dashboard-window--tray={tray}
	style:order={position}
	style={`--window-x: ${localGeometry.x}px; --window-y: ${localGeometry.y}px; --window-width: ${localGeometry.width}px; --window-height: ${localGeometry.height}px; --window-z: ${zIndex};`}
	onpointerdown={onFocus}
	use:routeWheelToPage
>
	<div
		role="toolbar"
		tabindex="-1"
		aria-label={`${title} panel controls`}
		class="window-titlebar flex min-h-9 items-center gap-1 border-4 border-black {tray
			? ''
			: 'border-b-0'} bg-[#808080] px-2 py-1 text-xs text-white"
		onpointerdown={(event) => startInteraction('drag', event)}
	>
		<span class="mr-auto truncate font-bold">{title}</span>
		<button
			type="button"
			data-drag-handle
			onpointerdown={startDragHandle}
			onkeydown={moveWithKeyboard}
			class="window-drag-handle hidden cursor-grab border-2 border-black bg-[#c0c0c0] px-2 py-0.5 font-bold text-black active:cursor-grabbing lg:block"
			aria-label={`Move ${title} window. Drag, or use the arrow keys.`}
			title="Drag window; arrow keys move it"
		>
			=
		</button>
		<button
			type="button"
			disabled={position === 0}
			onclick={() => onMove(-1)}
			class="border-2 border-black bg-[#c0c0c0] px-2 py-0.5 font-bold text-black hover:bg-white focus:ring-2 focus:ring-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-40 lg:hidden"
			aria-label={`Move ${title} panel up`}
			title="Move panel up"
		>
			^
		</button>
		<button
			type="button"
			disabled={position === total - 1}
			onclick={() => onMove(1)}
			class="border-2 border-black bg-[#c0c0c0] px-2 py-0.5 font-bold text-black hover:bg-white focus:ring-2 focus:ring-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-40 lg:hidden"
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
			aria-label={collapsed ? `Restore ${title} window` : `Minimize ${title} window`}
			title={collapsed ? 'Restore window' : 'Minimize window'}
		>
			<span aria-hidden="true">{collapsed ? '+' : '_'}</span>
		</button>
	</div>

	{#if !tray}
		<div id={`${panelId}-panel`} class="window-content">
			{@render children()}
		</div>
		<button
			type="button"
			class="window-resize-handle hidden lg:block"
			onpointerdown={(event) => startInteraction('resize', event)}
			onkeydown={resizeWithKeyboard}
			aria-label={`Resize ${title} window. Drag, or use the arrow keys.`}
			title="Drag to resize; arrow keys resize"
		>
			<span aria-hidden="true">◢</span>
		</button>
	{/if}
</div>

<style>
	@media (min-width: 1024px) {
		.dashboard-window:not(.dashboard-window--tray) {
			position: absolute;
			left: var(--window-x);
			top: var(--window-y);
			z-index: var(--window-z);
			width: var(--window-width);
			height: var(--window-height);
		}

		.window-titlebar {
			touch-action: none;
			cursor: move;
		}

		.window-content {
			height: calc(100% - 2.25rem);
			overflow: auto;
			overscroll-behavior: auto;
		}

		.window-content > :global(*) {
			min-height: 100%;
		}

		.window-resize-handle {
			position: absolute;
			right: 0;
			bottom: 0;
			z-index: 2;
			width: 1.75rem;
			height: 1.75rem;
			border-top: 2px solid #000;
			border-left: 2px solid #000;
			background: #c0c0c0;
			color: #000;
			font-size: 0.875rem;
			font-weight: 700;
			line-height: 1;
			cursor: nwse-resize;
			touch-action: none;
		}
	}
</style>
