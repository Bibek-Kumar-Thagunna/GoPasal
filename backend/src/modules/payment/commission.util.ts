/** Store `commission_rate` and order `commission_rate_snapshot` are percent values (e.g. 10 = 10%). */

export function normalizeCommissionPercent(percent: number | null | undefined): number {
    if (percent === null || percent === undefined || Number.isNaN(percent)) {
        return 10;
    }
    return Math.min(100, Math.max(0, percent));
}

export function splitGrossByCommissionPercent(
    gross: number,
    commissionPercent: number | null | undefined
): { commission: number; net: number; percentUsed: number } {
    const pct = normalizeCommissionPercent(commissionPercent);
    const commission = Math.round(gross * (pct / 100) * 100) / 100;
    const net = Math.round((gross - commission) * 100) / 100;
    return { commission, net, percentUsed: pct };
}
