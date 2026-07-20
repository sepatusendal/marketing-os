const idrFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function formatIDR(amount: number | string) {
  return idrFormatter.format(Number(amount));
}

const idrCompactFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Compact form ("Rp60,4 jt") for tight spaces like chart legends. */
export function formatIDRCompact(amount: number | string) {
  return idrCompactFormatter.format(Number(amount));
}

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  return dateFormatter.format(new Date(date));
}
