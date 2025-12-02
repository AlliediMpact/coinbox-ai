/**
 * Multi-Currency Support Service
 * Handles currency conversion and multi-currency transactions
 */

import axios from 'axios';

export type SupportedCurrency = 'ZAR' | 'USD' | 'EUR' | 'GBP' | 'NGN' | 'KES' | 'GHS' | 'TZS';

export interface CurrencyRate {
  from: SupportedCurrency;
  to: SupportedCurrency;
  rate: number;
  lastUpdated: Date;
}

export interface CurrencyBalance {
  currency: SupportedCurrency;
  balance: number;
  balanceUSD: number; // Normalized to USD
}

export interface MultiCurrencyWallet {
  userId: string;
  balances: {
    [key in SupportedCurrency]?: number;
  };
  primaryCurrency: SupportedCurrency;
  lastUpdated: Date;
}

class MultiCurrencyService {
  private exchangeRateApiUrl = 'https://api.exchangerate-api.com/v4/latest';
  private cachedRates: Map<string, { rate: number; timestamp: number }> = new Map();
  private cacheTimeout = 3600000; // 1 hour

  // Currency symbols and info
  private currencyInfo: {
    [key in SupportedCurrency]: {
      symbol: string;
      name: string;
      country: string;
      decimals: number;
    };
  } = {
    ZAR: { symbol: 'R', name: 'South African Rand', country: 'South Africa', decimals: 2 },
    USD: { symbol: '$', name: 'US Dollar', country: 'United States', decimals: 2 },
    EUR: { symbol: '€', name: 'Euro', country: 'European Union', decimals: 2 },
    GBP: { symbol: '£', name: 'British Pound', country: 'United Kingdom', decimals: 2 },
    NGN: { symbol: '₦', name: 'Nigerian Naira', country: 'Nigeria', decimals: 2 },
    KES: { symbol: 'KSh', name: 'Kenyan Shilling', country: 'Kenya', decimals: 2 },
    GHS: { symbol: 'GH₵', name: 'Ghanaian Cedi', country: 'Ghana', decimals: 2 },
    TZS: { symbol: 'TSh', name: 'Tanzanian Shilling', country: 'Tanzania', decimals: 2 },
  };

  /**
   * Get exchange rate between two currencies
   */
  async getExchangeRate(from: SupportedCurrency, to: SupportedCurrency): Promise<number> {
    if (from === to) return 1;

    const cacheKey = `${from}_${to}`;
    const cached = this.cachedRates.get(cacheKey);

    // Return cached rate if recent
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.rate;
    }

    try {
      const response = await axios.get(`${this.exchangeRateApiUrl}/${from}`, {
        timeout: 5000,
      });

      const rate = response.data.rates[to];
      
      if (!rate) {
        throw new Error(`Exchange rate not available for ${from} to ${to}`);
      }

      // Cache the rate
      this.cachedRates.set(cacheKey, {
        rate,
        timestamp: Date.now(),
      });

      return rate;
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      
      // Return fallback rates if API fails
      return this.getFallbackRate(from, to);
    }
  }

  /**
   * Convert amount from one currency to another
   */
  async convertCurrency(
    amount: number,
    from: SupportedCurrency,
    to: SupportedCurrency
  ): Promise<{
    amount: number;
    convertedAmount: number;
    rate: number;
    fee: number;
    totalCost: number;
  }> {
    const rate = await this.getExchangeRate(from, to);
    const convertedAmount = amount * rate;
    
    // Calculate conversion fee (0.5%)
    const fee = amount * 0.005;
    const totalCost = amount + fee;

    return {
      amount,
      convertedAmount,
      rate,
      fee,
      totalCost,
    };
  }

  /**
   * Get all exchange rates for a base currency
   */
  async getAllRates(baseCurrency: SupportedCurrency): Promise<CurrencyRate[]> {
    const currencies: SupportedCurrency[] = ['ZAR', 'USD', 'EUR', 'GBP', 'NGN', 'KES', 'GHS', 'TZS'];
    const rates: CurrencyRate[] = [];

    for (const currency of currencies) {
      if (currency === baseCurrency) continue;

      const rate = await this.getExchangeRate(baseCurrency, currency);
      rates.push({
        from: baseCurrency,
        to: currency,
        rate,
        lastUpdated: new Date(),
      });
    }

    return rates;
  }

  /**
   * Format currency amount with symbol
   */
  formatCurrency(amount: number, currency: SupportedCurrency): string {
    const info = this.currencyInfo[currency];
    const formatted = amount.toFixed(info.decimals);
    
    // Format with thousands separators
    const parts = formatted.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    return `${info.symbol}${parts.join('.')}`;
  }

  /**
   * Get currency info
   */
  getCurrencyInfo(currency: SupportedCurrency) {
    return this.currencyInfo[currency];
  }

  /**
   * Get all supported currencies
   */
  getSupportedCurrencies(): Array<{
    code: SupportedCurrency;
    symbol: string;
    name: string;
    country: string;
  }> {
    return Object.entries(this.currencyInfo).map(([code, info]) => ({
      code: code as SupportedCurrency,
      ...info,
    }));
  }

  /**
   * Normalize amount to USD for comparison
   */
  async normalizeToUSD(amount: number, currency: SupportedCurrency): Promise<number> {
    if (currency === 'USD') return amount;
    const rate = await this.getExchangeRate(currency, 'USD');
    return amount * rate;
  }

  /**
   * Fallback exchange rates (approximate, update regularly)
   */
  private getFallbackRate(from: SupportedCurrency, to: SupportedCurrency): number {
    // Approximate rates to USD as intermediary
    const toUSD: { [key in SupportedCurrency]: number } = {
      ZAR: 0.054, // 1 ZAR = 0.054 USD
      USD: 1,
      EUR: 1.08,
      GBP: 1.26,
      NGN: 0.0013, // 1 NGN = 0.0013 USD
      KES: 0.0077, // 1 KES = 0.0077 USD
      GHS: 0.087, // 1 GHS = 0.087 USD
      TZS: 0.00043, // 1 TZS = 0.00043 USD
    };

    // Convert through USD
    const amountInUSD = toUSD[from];
    const targetRate = toUSD[to];

    return amountInUSD / targetRate;
  }

  /**
   * Calculate total portfolio value in specific currency
   */
  async calculatePortfolioValue(
    balances: { currency: SupportedCurrency; amount: number }[],
    targetCurrency: SupportedCurrency
  ): Promise<{
    total: number;
    currency: SupportedCurrency;
    breakdown: Array<{
      currency: SupportedCurrency;
      amount: number;
      valueInTarget: number;
    }>;
  }> {
    let total = 0;
    const breakdown: Array<{
      currency: SupportedCurrency;
      amount: number;
      valueInTarget: number;
    }> = [];

    for (const balance of balances) {
      const rate = await this.getExchangeRate(balance.currency, targetCurrency);
      const valueInTarget = balance.amount * rate;
      total += valueInTarget;

      breakdown.push({
        currency: balance.currency,
        amount: balance.amount,
        valueInTarget,
      });
    }

    return {
      total,
      currency: targetCurrency,
      breakdown,
    };
  }

  /**
   * Get best exchange rate across multiple providers (future enhancement)
   */
  async getBestRate(
    from: SupportedCurrency,
    to: SupportedCurrency,
    amount: number
  ): Promise<{
    bestRate: number;
    provider: string;
    estimatedAmount: number;
    fee: number;
  }> {
    // For now, just use our single provider
    // In production, compare rates from multiple providers
    const rate = await this.getExchangeRate(from, to);
    const fee = amount * 0.005;
    const estimatedAmount = (amount - fee) * rate;

    return {
      bestRate: rate,
      provider: 'ExchangeRate-API',
      estimatedAmount,
      fee,
    };
  }

  /**
   * Clear rate cache (useful for testing or forcing refresh)
   */
  clearCache() {
    this.cachedRates.clear();
  }
}

export const multiCurrencyService = new MultiCurrencyService();
