/**
 * MR.FANTASTIC — Currency Detection & Conversion
 * Detects user country via IP, fetches live exchange rates,
 * exposes window.MF_Currency for use across shop + checkout.
 *
 * Geo API  : ipapi.co (free, 1000 req/day, no key needed)
 * Rates API: frankfurter.app (free, ECB rates, no key needed)
 */

// Immediate fallback — guarantee window.MF_Currency is never undefined
window.MF_Currency = {
  code: 'GHS',
  symbol: 'GH₵',
  rate: 1,
  country: 'GH',
  convert: (usdAmount) => Math.round(usdAmount),
  format: (usdAmount) => 'GH₵' + Math.round(usdAmount).toLocaleString(),
  paystackAmount: (usdAmount) => Math.round(usdAmount * 100)
};

(async () => {
  /* ── Currency map: country code → Paystack currency ─── */
  const CURRENCY_MAP = {
    // Africa — Paystack native
    GH: { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' },
    NG: { code: 'NGN', symbol: '₦',   name: 'Nigerian Naira' },
    ZA: { code: 'ZAR', symbol: 'R',   name: 'South African Rand' },
    KE: { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
    // North America
    US: { code: 'USD', symbol: '$',   name: 'US Dollar' },
    CA: { code: 'USD', symbol: '$',   name: 'US Dollar' },
    // Europe
    GB: { code: 'GBP', symbol: '£',   name: 'British Pound' },
    DE: { code: 'EUR', symbol: '€',   name: 'Euro' },
    FR: { code: 'EUR', symbol: '€',   name: 'Euro' },
    IT: { code: 'EUR', symbol: '€',   name: 'Euro' },
    ES: { code: 'EUR', symbol: '€',   name: 'Euro' },
    NL: { code: 'EUR', symbol: '€',   name: 'Euro' },
    BE: { code: 'EUR', symbol: '€',   name: 'Euro' },
    AT: { code: 'EUR', symbol: '€',   name: 'Euro' },
    PT: { code: 'EUR', symbol: '€',   name: 'Euro' },
    IE: { code: 'EUR', symbol: '€',   name: 'Euro' },
    FI: { code: 'EUR', symbol: '€',   name: 'Euro' },
    GR: { code: 'EUR', symbol: '€',   name: 'Euro' },
    SE: { code: 'EUR', symbol: '€',   name: 'Euro' },
    NO: { code: 'EUR', symbol: '€',   name: 'Euro' },
    DK: { code: 'EUR', symbol: '€',   name: 'Euro' },
    // Oceania
    AU: { code: 'USD', symbol: '$',   name: 'US Dollar' },
    NZ: { code: 'USD', symbol: '$',   name: 'US Dollar' },
  };

  const DEFAULT_CURRENCY = { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' };

  /* ── Fallback: USD, no conversion needed ─────────────── */
  const setFallback = () => {
    window.MF_Currency = {
      code:    'GHS',
      symbol:  'GH₵',
      rate:    1,
      country: 'GH',
      convert: (usdAmount) => usdAmount,
      format:  (usdAmount) => 'GH₵' + usdAmount,
      paystackAmount: (usdAmount) => usdAmount * 100
    };
    window.dispatchEvent(new Event('mf:currency:ready'));
  };

  try {
    /* 1. Detect country from IP */
    const geoController = new AbortController();
    const geoTimeout = setTimeout(() => geoController.abort(), 3000);

    const geoRes = await fetch('https://ipapi.co/json/', {
      signal: geoController.signal
    });
    clearTimeout(geoTimeout);

    if (!geoRes.ok) { setFallback(); return; }
    const geo = await geoRes.json();
    const countryCode = geo.country_code || 'US';
    const currency = CURRENCY_MAP[countryCode] || DEFAULT_CURRENCY;

    /* 2. Fetch live exchange rate from USD */
    let rate = 1;
    if (currency.code !== 'USD') {
      const rateController = new AbortController();
      const rateTimeout = setTimeout(() => rateController.abort(), 3000);

      const rateRes = await fetch(
        `https://api.frankfurter.app/latest?from=USD&to=${currency.code}`,
        { signal: rateController.signal }
      );
      clearTimeout(rateTimeout);

      if (rateRes.ok) {
        const rateData = await rateRes.json();
        rate = rateData.rates[currency.code] ?? 1;
      }
    }

    /* 3. Expose global currency object */
    window.MF_Currency = {
      code:    currency.code,
      symbol:  currency.symbol,
      rate:    rate,
      country: countryCode,

      /** Convert USD amount to local currency (rounded) */
      convert: (usdAmount) => {
        return Math.round(usdAmount * rate);
      },

      /** Format for display: e.g. "GH₵450" or "$35" */
      format: (usdAmount) => {
        const amount = Math.round(usdAmount * rate);
        return currency.symbol + amount.toLocaleString();
      },

      /** Amount in smallest unit for Paystack (kobo / pesewas / cents) */
      paystackAmount: (usdAmount) => {
        return Math.round(usdAmount * rate * 100);
      }
    };

    window.dispatchEvent(new Event('mf:currency:ready'));

  } catch {
    // Network error, VPN, blocked — silently fall back to USD
    setFallback();
  }

})();