const INT_US = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const MONEY_US = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatInt(value: number) {
  return INT_US.format(value);
}

export function formatMoney(value: number) {
  return MONEY_US.format(value);
}
