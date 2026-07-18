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

export interface DashboardPreferences {
	order: DashboardPanelId[];
	collapsed: Partial<Record<DashboardPanelId, boolean>>;
}

const defaultPreferences: DashboardPreferences = {
	order: [...DASHBOARD_PANEL_IDS],
	collapsed: {}
};

export function loadDashboardPreferences(): DashboardPreferences {
	if (typeof localStorage === 'undefined') return clonePreferences(defaultPreferences);

	try {
		const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as {
			order?: unknown;
			collapsed?: unknown;
		};
		const order = Array.isArray(stored?.order)
			? stored.order.filter((id): id is DashboardPanelId => isPanelId(id))
			: [];
		const collapsed: Partial<Record<DashboardPanelId, boolean>> = {};

		if (stored?.collapsed && typeof stored.collapsed === 'object') {
			for (const id of DASHBOARD_PANEL_IDS) {
				if ((stored.collapsed as Record<string, unknown>)[id] === true) collapsed[id] = true;
			}
		}

		return {
			order: completeOrder(order),
			collapsed
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

function isPanelId(value: unknown): value is DashboardPanelId {
	return typeof value === 'string' && DASHBOARD_PANEL_IDS.includes(value as DashboardPanelId);
}

function clonePreferences(preferences: DashboardPreferences): DashboardPreferences {
	return {
		order: [...preferences.order],
		collapsed: { ...preferences.collapsed }
	};
}
