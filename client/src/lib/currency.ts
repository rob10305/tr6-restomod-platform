const currencySymbols: Record<string, string> = {
  USD: '$',
  CAD: 'C$',
  GBP: '£',
  EUR: '€',
  AUD: 'A$',
  NZD: 'NZ$',
  JPY: '¥',
  CHF: 'CHF ',
  SEK: 'kr ',
  NOK: 'kr ',
  DKK: 'kr ',
};

export function formatPrice(price: string | number, currency?: string | null): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  const currencyCode = currency?.toUpperCase() || 'USD';
  const symbol = currencySymbols[currencyCode] || `${currencyCode} `;
  
  if (currencyCode === 'JPY') {
    return `${symbol}${Math.round(numPrice).toLocaleString()}`;
  }
  
  return `${symbol}${numPrice.toFixed(2)}`;
}

export function getCurrencySymbol(currency?: string | null): string {
  const currencyCode = currency?.toUpperCase() || 'USD';
  return currencySymbols[currencyCode] || `${currencyCode} `;
}
