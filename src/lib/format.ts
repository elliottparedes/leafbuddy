const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	return d;
}

/** Human-readable relative date, e.g. "today", "yesterday", "in 3 days". */
export function formatRelativeDate(date: Date | string | null | undefined, now = new Date()): string {
	if (!date) return 'Not scheduled';

	const target = typeof date === 'string' ? new Date(date) : date;
	const diffDays = Math.round((startOfDay(target).getTime() - startOfDay(now).getTime()) / DAY_MS);

	if (diffDays === 0) return 'Today';
	if (diffDays === 1) return 'Tomorrow';
	if (diffDays === -1) return 'Yesterday';
	if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
	if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;

	return target.toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
		year: target.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
	});
}

export type WateringDueStatus = 'overdue' | 'due_today' | 'upcoming' | 'none';

/** Format next watering with urgency context. */
export function formatWateringDue(
	nextWaterAt: Date | string | null | undefined,
	now = new Date()
): { label: string; status: WateringDueStatus } {
	if (!nextWaterAt) {
		return { label: 'No schedule', status: 'none' };
	}

	const target = typeof nextWaterAt === 'string' ? new Date(nextWaterAt) : nextWaterAt;
	const diffMs = target.getTime() - now.getTime();
	const diffDays = Math.round((startOfDay(target).getTime() - startOfDay(now).getTime()) / DAY_MS);

	if (diffMs < 0) {
		const overdueDays = Math.abs(diffDays) || 1;
		return {
			label: overdueDays === 1 ? 'Overdue since yesterday' : `Overdue by ${overdueDays} days`,
			status: 'overdue'
		};
	}

	if (diffDays === 0) {
		return { label: 'Water today', status: 'due_today' };
	}

	if (diffDays === 1) {
		return { label: 'Water tomorrow', status: 'upcoming' };
	}

	return {
		label: `Water ${formatRelativeDate(target, now).toLowerCase()}`,
		status: 'upcoming'
	};
}