/** 1 CNY = 1e12 pico-CNY. Integer money so a debit cannot drift. */
export const PICO_PER_CNY = BigInt(1000000000000);

/** One-time welcome balance. Not monthly, and not a "free tier used" flag. */
export const WELCOME_GRANT_PICO_CNY = PICO_PER_CNY / BigInt(2);

export function formatCnyFromPico(value: bigint | string): string {
  let pico: bigint;
  try {
    pico = typeof value === "bigint" ? value : BigInt(value);
  } catch {
    return "0.000000";
  }
  const negative = pico < BigInt(0);
  const abs = negative ? -pico : pico;
  const whole = abs / PICO_PER_CNY;
  const frac = (abs % PICO_PER_CNY).toString().padStart(12, "0").slice(0, 6);
  return `${negative ? "-" : ""}${whole.toString()}.${frac}`;
}
