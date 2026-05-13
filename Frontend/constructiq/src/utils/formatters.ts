const usdFull = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const formatCurrency = (val: number): string => usdFull.format(val);

export const formatCurrencyCompact = (val: number): string =>
  usdCompact.format(val);

export const formatCurrencyK = (val: string): string => {
  const parsed = parseFloat(val);
  if (isNaN(parsed)) return "$0.00";
  return `$${(parsed / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 })}k`;
};

export function safeParse<T>(json: string | null): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export const formatCurrencyAdaptive = (val: number): string => {
  const abs = Math.abs(val);
  const sign = val < 0 ? "-" : "";

  if (abs >= 1_000_000_000) {
    return `${sign}$${(abs / 1_000_000_000).toFixed(1)}B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 10_000) {
    return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  }
  return usdFull.format(val);
};
