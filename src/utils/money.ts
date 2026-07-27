const CURRENCY_ALIASES: Record<string, string> = { JD: "JOD" };

export function formatMoney(value: number | undefined, currency: string | undefined, lang: "ar" | "en"): string {
  const raw = (currency || "JOD").toUpperCase();
  const code = CURRENCY_ALIASES[raw] || raw;
  const amount = Number(value || 0);
  try {
    return new Intl.NumberFormat(lang === "ar" ? "ar" : "en", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${raw}`;
  }
}
