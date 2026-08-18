import type { CurrencyRate } from '../types';

export const SUPPORTED_CURRENCIES: CurrencyRate[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', rateToBase: 1.0 },
  { code: 'EUR', symbol: '€', name: 'Euro', rateToBase: 0.92 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rateToBase: 155.0 },
  { code: 'GBP', symbol: '£', name: 'British Pound', rateToBase: 0.78 },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', rateToBase: 1.36 },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar', rateToBase: 1.52 },
  { code: 'SGD', symbol: 'SG$', name: 'Singapore Dollar', rateToBase: 1.34 },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', rateToBase: 36.5 },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', rateToBase: 1380.0 },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', rateToBase: 0.89 },
  { code: 'CNY', symbol: 'CN¥', name: 'Chinese Yuan', rateToBase: 7.24 },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', rateToBase: 16200.0 },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', rateToBase: 4.70 },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', rateToBase: 25400.0 },
];

export const currencyEngine = {
  getCurrency(code: string): CurrencyRate {
    return SUPPORTED_CURRENCIES.find(c => c.code.toUpperCase() === code.toUpperCase()) || {
      code: code.toUpperCase(),
      symbol: code.toUpperCase(),
      name: code.toUpperCase(),
      rateToBase: 1.0,
    };
  },

  /**
   * Converts an amount from a foreign currency to the base currency
   */
  convertToBase(amount: number, fromCurrencyCode: string, baseCurrencyCode: string = 'USD'): number {
    if (fromCurrencyCode.toUpperCase() === baseCurrencyCode.toUpperCase()) return amount;

    const fromCurr = currencyEngine.getCurrency(fromCurrencyCode);
    const baseCurr = currencyEngine.getCurrency(baseCurrencyCode);

    // Convert from foreign to USD first, then from USD to base
    const inUSD = amount / fromCurr.rateToBase;
    const inBase = inUSD * baseCurr.rateToBase;

    return Math.round(inBase * 100) / 100;
  }
};
