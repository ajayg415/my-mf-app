// 2. Formatters
export const formatMoney = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatShortMoney = (amount) => {
  const absAmount = Math.abs(amount);
  if (absAmount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1).replace(/\.0$/, "")}Cr`;
  }
  if (absAmount >= 100000) {
    return `₹${(amount / 100000).toFixed(1).replace(/\.0$/, "")}L`;
  }
  if (absAmount >= 1000) {
    return `₹${(amount / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return `₹${amount.toFixed(0)}`;
};

