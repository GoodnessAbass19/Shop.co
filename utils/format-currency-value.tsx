export const formatCurrencyValue = (value: any) => {
  const formattedValue = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "USD",
  }).format(value);

  // Split the formatted value before the decimal point
  const parts = formattedValue;
  // .split(".");
  return parts;
};
