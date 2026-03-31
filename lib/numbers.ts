export function asNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return 0;
}

export function toMoney(value: unknown) {
  return Number(asNumber(value).toFixed(2));
}
