const idrFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function formatIDR(amount: number | string) {
  return idrFormatter.format(Number(amount));
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
