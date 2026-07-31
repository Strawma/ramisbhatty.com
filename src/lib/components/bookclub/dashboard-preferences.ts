const STORAGE_KEY = 'bookclub-dashboard-preferences';

export const DASHBOARD_PANEL_IDS = [
	'current-book',
	'suggestions',
	'chatroom',
	'archive',
	'profile',
	'admin'
] as const;

export type DashboardPanelId = (typeof DASHBOARD_PANEL_IDS)[number];

export interface DashboardWindowGeometry {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface DashboardPreferences {
	order: DashboardPanelId[];
	collapsed: Partial<Record<DashboardPanelId, boolean>>;
	windows: Partial<Record<DashboardPanelId, DashboardWindowGeometry>>;
	zOrder: DashboardPanelId[];
}

const defaultPreferences: DashboardPreferences = {
	order: [...DASHBOARD_PANEL_IDS],
	collapsed: {},
	windows: {},
	zOrder: [...DASHBOARD_PANEL_IDS]
};

export function loadDashboardPreferences(): DashboardPreferences {
	if (typeof localStorage === 'undefined') return clonePreferences(defaultPreferences);

	try {
		const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as {
			order?: unknown;
			collapsed?: unknown;
			windows?: unknown;
			zOrder?: unknown;
		};
		const order = Array.isArray(stored?.order)
			? stored.order.filter((id): id is DashboardPanelId => isPanelId(id))
			: [];
		const collapsed: Partial<Record<DashboardPanelId, boolean>> = {};
		const windows: Partial<Record<DashboardPanelId, DashboardWindowGeometry>> = {};

		if (stored?.collapsed && typeof stored.collapsed === 'object') {
			for (const id of DASHBOARD_PANEL_IDS) {
				if ((stored.collapsed as Record<string, unknown>)[id] === true) collapsed[id] = true;
			}
		}
		if (stored?.windows && typeof stored.windows === 'object') {
			for (const id of DASHBOARD_PANEL_IDS) {
				const geometry = parseWindowGeometry((stored.windows as Record<string, unknown>)[id]);
				if (geometry) windows[id] = geometry;
			}
		}
		const zOrder = Array.isArray(stored?.zOrder)
			? stored.zOrder.filter((id): id is DashboardPanelId => isPanelId(id))
			: [];

		return {
			order: completeOrder(order),
			collapsed,
			windows,
			zOrder: completeOrder(zOrder)
		};
	} catch {
		return clonePreferences(defaultPreferences);
	}
}

export function saveDashboardPreferences(preferences: DashboardPreferences): void {
	if (typeof localStorage === 'undefined') return;

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
	} catch {
		// Storage can be unavailable in private or restricted browser contexts.
	}
}

export function completeOrder(order: DashboardPanelId[]): DashboardPanelId[] {
	const completedOrder = [...new Set([...order, ...DASHBOARD_PANEL_IDS])];
	if (order.includes('profile')) return completedOrder;

	const profileIndex = completedOrder.indexOf('profile');
	completedOrder.splice(profileIndex, 1);
	completedOrder.splice(completedOrder.indexOf('admin'), 0, 'profile');
	return completedOrder;
}

export function createDefaultWindowGeometries(
	workspaceWidth: number
): Record<DashboardPanelId, DashboardWindowGeometry> {
	const gap = 16;
	const safeWidth = Math.max(640, Math.floor(workspaceWidth));
	const columnWidth = Math.floor((safeWidth - gap) / 2);

	return {
		'current-book': { x: 0, y: 0, width: safeWidth, height: 410 },
		suggestions: { x: 0, y: 426, width: columnWidth, height: 570 },
		chatroom: { x: columnWidth + gap, y: 426, width: columnWidth, height: 520 },
		archive: { x: 0, y: 1012, width: columnWidth, height: 480 },
		profile: { x: columnWidth + gap, y: 962, width: columnWidth, height: 340 },
		admin: { x: columnWidth + gap, y: 1318, width: columnWidth, height: 650 }
	};
}

export function constrainWindowGeometry(
	geometry: DashboardWindowGeometry,
	workspaceWidth: number
): DashboardWindowGeometry {
	const safeWorkspaceWidth = Math.max(280, Math.floor(workspaceWidth));
	const width = Math.min(Math.max(280, Math.round(geometry.width)), safeWorkspaceWidth);

	return {
		x: Math.min(Math.max(0, Math.round(geometry.x)), Math.max(0, safeWorkspaceWidth - width)),
		y: Math.max(0, Math.round(geometry.y)),
		width,
		height: Math.max(220, Math.round(geometry.height))
	};
}

function isPanelId(value: unknown): value is DashboardPanelId {
	return typeof value === 'string' && DASHBOARD_PANEL_IDS.includes(value as DashboardPanelId);
}

function parseWindowGeometry(value: unknown): DashboardWindowGeometry | null {
	if (!value || typeof value !== 'object') return null;
	const candidate = value as Record<string, unknown>;
	const numbers = [candidate.x, candidate.y, candidate.width, candidate.height];
	if (!numbers.every((number) => typeof number === 'number' && Number.isFinite(number)))
		return null;

	return {
		x: Math.max(0, Math.round(candidate.x as number)),
		y: Math.max(0, Math.round(candidate.y as number)),
		width: Math.min(4000, Math.max(280, Math.round(candidate.width as number))),
		height: Math.min(4000, Math.max(220, Math.round(candidate.height as number)))
	};
}

function clonePreferences(preferences: DashboardPreferences): DashboardPreferences {
	return {
		order: [...preferences.order],
		collapsed: { ...preferences.collapsed },
		windows: Object.fromEntries(
			Object.entries(preferences.windows).map(([id, geometry]) => [
				id,
				geometry ? { ...geometry } : geometry
			])
		),
		zOrder: [...preferences.zOrder]
	};
}
