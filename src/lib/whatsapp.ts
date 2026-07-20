/** Builds a wa.me deep link from a free-form phone number (ID-first: leading 0 -> 62). */
export function whatsappLink(phone: string, message?: string) {
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${normalized}${query}`;
}
