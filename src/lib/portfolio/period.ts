/** "2024-06-01" or "2024-06" -> "Jun 2024" */
export function formatMonth(date?: string | null) {
    if (!date) return '';
    const value = String(date).length === 7 ? `${date}-01` : String(date);
    const d = new Date(value);
    return isNaN(d.getTime())
        ? String(date)
        : d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

/** Display range such as "Jun 2024 - Present" */
export function formatPeriod(start?: string | null, end?: string | null, isCurrent?: boolean) {
    const from = formatMonth(start);
    const to = isCurrent || !end ? (from ? 'Present' : '') : formatMonth(end);
    return [from, to].filter(Boolean).join(' - ');
}
