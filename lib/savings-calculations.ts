export function dailyYield(principal: number, annualRate: number): number {
  return parseFloat(((principal * annualRate) / 365).toFixed(4));
}

export function projectedYield(
  principal: number,
  annualRate: number,
  termDays: number | null
): number {
  if (!termDays) return parseFloat(((principal * annualRate) / 365 * 30).toFixed(2)); // 30-day estimate for flexible
  return parseFloat(((principal * annualRate * termDays) / 365).toFixed(2));
}

export function effectiveApy(annualRate: number): number {
  // Compounded daily
  return parseFloat(((Math.pow(1 + annualRate / 365, 365) - 1) * 100).toFixed(2));
}

export function daysElapsed(depositedAt: string): number {
  const ms = Date.now() - new Date(depositedAt).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function daysRemaining(maturesAt: string | null): number | null {
  if (!maturesAt) return null;
  const ms = new Date(maturesAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function progressPercent(depositedAt: string, maturesAt: string | null): number {
  if (!maturesAt) return 0;
  const total = new Date(maturesAt).getTime() - new Date(depositedAt).getTime();
  const elapsed = Date.now() - new Date(depositedAt).getTime();
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

export function formatAed(value: number): string {
  return `AED ${value.toLocaleString("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
