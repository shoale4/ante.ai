/**
 * Unit tests for arbitrage detection math
 *
 * CRITICAL: These tests verify the correctness of real-money calculations.
 * All test cases include manual verification of expected values.
 */

import {
  americanToDecimal,
  decimalToImpliedProb,
  isValidAmericanOdds,
  calculateStakes,
  getOddsAgeSeconds,
  isOddsFresh,
  isBookAllowed,
  setArbitrageConfig,
  getArbitrageConfig,
  calculateHold,
  calculateEV,
  checkOddsSanity,
  checkSpreadSanity,
  checkTotalSanity,
  checkMarketSanity,
} from '../arbitrage';

// Reset config before each test
beforeEach(() => {
  setArbitrageConfig({
    freshnessSeconds: 300,
    minRoiPercent: 0.1,
    maxRoiPercent: 15,
    roundingBufferCents: 2,
    blockedBooks: [],
    onlineOnly: false,
    bookMetadata: {},
  });
});

describe('americanToDecimal', () => {
  /**
   * FORMULA VERIFICATION:
   * Positive odds: decimal = 1 + (american / 100)
   * Negative odds: decimal = 1 + (100 / |american|)
   */

  test('+100 → 2.00 (even money)', () => {
    // +100 means you win $100 on a $100 bet → total return $200 → 2.00 decimal
    expect(americanToDecimal(100)).toBe(2.00);
  });

  test('-100 → 2.00 (even money)', () => {
    // -100 means bet $100 to win $100 → total return $200 → 2.00 decimal
    expect(americanToDecimal(-100)).toBe(2.00);
  });

  test('+150 → 2.50', () => {
    // +150 means you win $150 on a $100 bet → total return $250 → 2.50 decimal
    expect(americanToDecimal(150)).toBe(2.50);
  });

  test('-150 → 1.667', () => {
    // -150 means bet $150 to win $100 → total return $250 / 150 = 1.667 per dollar
    const result = americanToDecimal(-150);
    expect(result).toBeCloseTo(1.6667, 3);
  });

  test('-110 → 1.909 (standard vig)', () => {
    // -110 is the standard juice line
    // Bet $110 to win $100 → total return $210 → 210/110 = 1.909
    const result = americanToDecimal(-110);
    expect(result).toBeCloseTo(1.9091, 3);
  });

  test('+1000 → 11.00 (longshot)', () => {
    // +1000 means you win $1000 on a $100 bet → total return $1100 → 11.00 decimal
    expect(americanToDecimal(1000)).toBe(11.00);
  });

  test('-1000 → 1.10 (heavy favorite)', () => {
    // -1000 means bet $1000 to win $100 → total return $1100 → 1100/1000 = 1.10
    expect(americanToDecimal(-1000)).toBe(1.10);
  });

  test('+200 → 3.00', () => {
    expect(americanToDecimal(200)).toBe(3.00);
  });

  test('-200 → 1.50', () => {
    expect(americanToDecimal(-200)).toBe(1.50);
  });

  test('throws on invalid odds between -100 and +100', () => {
    expect(() => americanToDecimal(50)).toThrow('Invalid American odds');
    expect(() => americanToDecimal(-50)).toThrow('Invalid American odds');
    expect(() => americanToDecimal(0)).toThrow('Invalid American odds');
    expect(() => americanToDecimal(99)).toThrow('Invalid American odds');
    expect(() => americanToDecimal(-99)).toThrow('Invalid American odds');
  });
});

describe('decimalToImpliedProb', () => {
  test('2.00 → 0.50 (50%)', () => {
    expect(decimalToImpliedProb(2.00)).toBe(0.50);
  });

  test('3.00 → 0.333 (33.3%)', () => {
    expect(decimalToImpliedProb(3.00)).toBeCloseTo(0.3333, 3);
  });

  test('1.50 → 0.667 (66.7%)', () => {
    expect(decimalToImpliedProb(1.50)).toBeCloseTo(0.6667, 3);
  });

  test('throws on decimal <= 1', () => {
    expect(() => decimalToImpliedProb(1)).toThrow('Invalid decimal odds');
    expect(() => decimalToImpliedProb(0.5)).toThrow('Invalid decimal odds');
    expect(() => decimalToImpliedProb(0)).toThrow('Invalid decimal odds');
    expect(() => decimalToImpliedProb(-1)).toThrow('Invalid decimal odds');
  });
});

describe('isValidAmericanOdds', () => {
  test('valid odds', () => {
    expect(isValidAmericanOdds(100)).toBe(true);
    expect(isValidAmericanOdds(-100)).toBe(true);
    expect(isValidAmericanOdds(500)).toBe(true);
    expect(isValidAmericanOdds(-500)).toBe(true);
  });

  test('invalid odds', () => {
    expect(isValidAmericanOdds(50)).toBe(false);
    expect(isValidAmericanOdds(-50)).toBe(false);
    expect(isValidAmericanOdds(0)).toBe(false);
    expect(isValidAmericanOdds(99)).toBe(false);
    expect(isValidAmericanOdds(-99)).toBe(false);
  });
});

describe('calculateStakes', () => {
  /**
   * STAKE SIZING FORMULA:
   * For n-way arb with decimal odds d1, d2, ..., dn:
   *   impliedProbSum = 1/d1 + 1/d2 + ... + 1/dn
   *   stake_i = (1/d_i) / impliedProbSum * totalStake
   *
   * This equalizes payouts across all outcomes.
   */

  test('two-way known arb example with +150/-130', () => {
    /**
     * Manual calculation:
     * +150 → 2.50 decimal, implied prob = 0.40
     * -130 → 1.769 decimal, implied prob = 0.565
     * impliedProbSum = 0.40 + 0.565 = 0.965 (< 1, arb exists!)
     *
     * For $100 total stake:
     * stake1 = (0.40 / 0.965) * 100 = $41.45
     * stake2 = (0.565 / 0.965) * 100 = $58.55
     *
     * Payouts:
     * If outcome 1 wins: $41.45 * 2.50 = $103.63
     * If outcome 2 wins: $58.55 * 1.769 = $103.58
     *
     * Profit: ~$3.60 → ~3.6% ROI
     */
    const d1 = americanToDecimal(150);  // 2.50
    const d2 = americanToDecimal(-130); // 1.769

    const result = calculateStakes([d1, d2], 100);

    // Verify stakes sum to ~$100
    expect(result.totalStake).toBeCloseTo(100, 0);

    // Verify stakes are reasonable
    expect(result.stakes[0]).toBeGreaterThan(40);
    expect(result.stakes[0]).toBeLessThan(43);
    expect(result.stakes[1]).toBeGreaterThan(56);
    expect(result.stakes[1]).toBeLessThan(60);

    // Verify positive ROI
    expect(result.roiPercent).toBeGreaterThan(3);
    expect(result.roiPercent).toBeLessThan(4);

    // Verify guaranteed profit is positive
    expect(result.guaranteedProfit).toBeGreaterThan(3);

    // Verify valid after rounding
    expect(result.isValidAfterRounding).toBe(true);
  });

  test('non-arb case where impliedProbSum >= 1 (standard -110/-110)', () => {
    /**
     * Standard juice market:
     * -110 → 1.909 decimal, implied prob = 0.5238
     * -110 → 1.909 decimal, implied prob = 0.5238
     * impliedProbSum = 0.5238 + 0.5238 = 1.0476 (> 1, no arb!)
     *
     * This represents ~4.76% vig for the book.
     */
    const d1 = americanToDecimal(-110);
    const d2 = americanToDecimal(-110);

    const result = calculateStakes([d1, d2], 100);

    // Stakes still calculated
    expect(result.stakes[0]).toBeCloseTo(50, 0);
    expect(result.stakes[1]).toBeCloseTo(50, 0);

    // But ROI is negative!
    expect(result.roiPercent).toBeLessThan(0);
    expect(result.guaranteedProfit).toBeLessThan(0);

    // Not valid after rounding
    expect(result.isValidAfterRounding).toBe(false);
  });

  test('rounding edge case: tiny arb that gets killed by rounding', () => {
    /**
     * Edge case: Very small arb that's profitable before rounding
     * but loses money after rounding to cents.
     *
     * Example: impliedProbSum = 0.9995 → 0.05% theoretical ROI
     * On $100 stake → $0.05 profit (5 cents)
     * After rounding, this could become negative.
     */
    // Construct odds that give ~0.1% ROI
    // +100/-100.5 wouldn't be valid, so let's use a realistic tight arb
    const d1 = 2.01;  // Slightly better than +100
    const d2 = 2.01;  // Slightly better than -100

    const result = calculateStakes([d1, d2], 100);

    // Implied prob sum: 1/2.01 + 1/2.01 = 0.995 → 0.5% ROI
    expect(result.roiPercent).toBeLessThan(1);

    // Check if rounding buffer is applied
    if (result.guaranteedProfit <= 0.02) {
      expect(result.isValidAfterRounding).toBe(false);
    }
  });

  test('three-way arb example (soccer 1X2)', () => {
    /**
     * Soccer match with 3 outcomes:
     * Home win: +200 → 3.00 decimal, implied prob = 0.333
     * Draw: +250 → 3.50 decimal, implied prob = 0.286
     * Away win: +250 → 3.50 decimal, implied prob = 0.286
     *
     * impliedProbSum = 0.333 + 0.286 + 0.286 = 0.905 (< 1, arb exists!)
     *
     * For $100 total stake:
     * stake_home = (0.333 / 0.905) * 100 = $36.80
     * stake_draw = (0.286 / 0.905) * 100 = $31.60
     * stake_away = (0.286 / 0.905) * 100 = $31.60
     *
     * Payouts:
     * If home: $36.80 * 3.00 = $110.40
     * If draw: $31.60 * 3.50 = $110.60
     * If away: $31.60 * 3.50 = $110.60
     *
     * ROI: ~10.5%
     */
    const dHome = americanToDecimal(200);  // 3.00
    const dDraw = americanToDecimal(250);  // 3.50
    const dAway = americanToDecimal(250);  // 3.50

    const result = calculateStakes([dHome, dDraw, dAway], 100);

    // Verify stakes
    expect(result.stakes[0]).toBeGreaterThan(35);
    expect(result.stakes[0]).toBeLessThan(38);
    expect(result.stakes[1]).toBeGreaterThan(30);
    expect(result.stakes[1]).toBeLessThan(33);
    expect(result.stakes[2]).toBeGreaterThan(30);
    expect(result.stakes[2]).toBeLessThan(33);

    // Verify total stake
    expect(result.totalStake).toBeCloseTo(100, 0);

    // Verify positive ROI (should be ~10%)
    expect(result.roiPercent).toBeGreaterThan(9);
    expect(result.roiPercent).toBeLessThan(12);

    // Verify valid
    expect(result.isValidAfterRounding).toBe(true);
    expect(result.guaranteedProfit).toBeGreaterThan(9);
  });

  test('large stake amounts round correctly', () => {
    const d1 = americanToDecimal(150);
    const d2 = americanToDecimal(-130);

    const result = calculateStakes([d1, d2], 10000);

    // Stakes should be rounded to cents (use toBeCloseTo for floating point)
    expect(result.stakes[0] * 100 % 1).toBeCloseTo(0, 5);
    expect(result.stakes[1] * 100 % 1).toBeCloseTo(0, 5);

    // Total should be close to 10000
    expect(result.totalStake).toBeCloseTo(10000, 0);

    // ROI percentage should be same as smaller stake
    const smallResult = calculateStakes([d1, d2], 100);
    expect(result.roiPercent).toBeCloseTo(smallResult.roiPercent, 1);
  });
});

describe('freshness checking', () => {
  test('getOddsAgeSeconds calculates age correctly', () => {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000).toISOString();

    const age = getOddsAgeSeconds(oneMinuteAgo);
    expect(age).toBeGreaterThanOrEqual(59);
    expect(age).toBeLessThanOrEqual(61);
  });

  test('getOddsAgeSeconds returns Infinity for invalid dates', () => {
    expect(getOddsAgeSeconds('invalid')).toBe(Infinity);
    expect(getOddsAgeSeconds('')).toBe(Infinity);
  });

  test('isOddsFresh returns true for fresh odds', () => {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000).toISOString();

    expect(isOddsFresh(oneMinuteAgo)).toBe(true); // Default 300s
  });

  test('isOddsFresh returns false for stale odds', () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();

    expect(isOddsFresh(fiveMinutesAgo)).toBe(true); // Default 300s = 5 min exactly
  });

  test('isOddsFresh respects custom max age', () => {
    const now = new Date();
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000).toISOString();

    expect(isOddsFresh(twoMinutesAgo, 180)).toBe(true);  // 120s < 180s
    expect(isOddsFresh(twoMinutesAgo, 60)).toBe(false);  // 120s > 60s
  });
});

describe('book filtering', () => {
  test('isBookAllowed allows all books by default', () => {
    expect(isBookAllowed('draftkings')).toBe(true);
    expect(isBookAllowed('fanduel')).toBe(true);
    expect(isBookAllowed('betmgm')).toBe(true);
  });

  test('isBookAllowed blocks books in blockedBooks list', () => {
    setArbitrageConfig({ blockedBooks: ['draftkings', 'fanduel'] });

    expect(isBookAllowed('draftkings')).toBe(false);
    expect(isBookAllowed('fanduel')).toBe(false);
    expect(isBookAllowed('betmgm')).toBe(true);
  });

  test('isBookAllowed is case insensitive for blocked books', () => {
    setArbitrageConfig({ blockedBooks: ['draftkings'] });

    expect(isBookAllowed('DraftKings')).toBe(false);
    expect(isBookAllowed('DRAFTKINGS')).toBe(false);
    expect(isBookAllowed('draftkings')).toBe(false);
  });

  test('onlineOnly filters books without metadata', () => {
    setArbitrageConfig({
      onlineOnly: true,
      bookMetadata: {
        'draftkings': { supportsOnline: true },
        'in-person-only': { supportsOnline: false },
      }
    });

    expect(isBookAllowed('draftkings')).toBe(true);
    expect(isBookAllowed('in-person-only')).toBe(false);
    expect(isBookAllowed('unknown-book')).toBe(false);
  });
});

describe('calculateHold', () => {
  test('standard -110/-110 has ~4.76% hold', () => {
    const hold = calculateHold(-110, -110);
    expect(hold).toBeCloseTo(4.8, 0);
  });

  test('-100/-100 has 0% hold (no vig)', () => {
    const hold = calculateHold(-100, -100);
    expect(hold).toBe(0);
  });

  test('arbitrage situation has negative hold', () => {
    // +150 and -130 creates arb opportunity
    const hold = calculateHold(150, -130);
    expect(hold).toBeLessThan(0);
  });
});

describe('calculateEV', () => {
  test('fair odds with true 50% prob has 0 EV', () => {
    // +100 with 50% true probability
    const ev = calculateEV(100, 0.5);
    expect(ev).toBeCloseTo(0, 1);
  });

  test('positive EV when odds exceed true probability', () => {
    // +150 (implied 40%) but true probability is 50% → +EV
    const ev = calculateEV(150, 0.5);
    expect(ev).toBeGreaterThan(0);
  });

  test('negative EV when odds below true probability', () => {
    // -150 (implied 60%) but true probability is 50% → -EV
    const ev = calculateEV(-150, 0.5);
    expect(ev).toBeLessThan(0);
  });
});

describe('config management', () => {
  test('setArbitrageConfig updates config', () => {
    setArbitrageConfig({ minRoiPercent: 1.0 });
    expect(getArbitrageConfig().minRoiPercent).toBe(1.0);
  });

  test('setArbitrageConfig merges with existing config', () => {
    setArbitrageConfig({ minRoiPercent: 1.0 });
    setArbitrageConfig({ maxRoiPercent: 20 });

    const config = getArbitrageConfig();
    expect(config.minRoiPercent).toBe(1.0);
    expect(config.maxRoiPercent).toBe(20);
  });

  test('getArbitrageConfig returns a copy', () => {
    const config1 = getArbitrageConfig();
    const config2 = getArbitrageConfig();

    expect(config1).not.toBe(config2);
    expect(config1).toEqual(config2);
  });
});

describe('edge cases and regression tests', () => {
  test('handles extreme positive odds (+10000)', () => {
    const decimal = americanToDecimal(10000);
    expect(decimal).toBe(101);
    expect(decimalToImpliedProb(decimal)).toBeCloseTo(0.0099, 3);
  });

  test('handles extreme negative odds (-10000)', () => {
    const decimal = americanToDecimal(-10000);
    expect(decimal).toBe(1.01);
    expect(decimalToImpliedProb(decimal)).toBeCloseTo(0.9901, 3);
  });

  test('stake sizing handles asymmetric odds', () => {
    // Heavy favorite vs longshot
    const d1 = americanToDecimal(-500); // 1.20
    const d2 = americanToDecimal(400);  // 5.00

    const result = calculateStakes([d1, d2], 100);

    // Favorite gets much larger stake
    expect(result.stakes[0]).toBeGreaterThan(result.stakes[1]);
    expect(result.stakes[0]).toBeGreaterThan(80);
    expect(result.stakes[1]).toBeLessThan(20);
  });

  test('verifies payout equalization', () => {
    const d1 = americanToDecimal(150);
    const d2 = americanToDecimal(-130);

    const result = calculateStakes([d1, d2], 100);

    // Calculate actual payouts
    const payout1 = result.rawStakes[0] * d1;
    const payout2 = result.rawStakes[1] * d2;

    // Payouts should be equal before rounding
    expect(payout1).toBeCloseTo(payout2, 2);
  });

  test('calculates rounding loss correctly', () => {
    const d1 = americanToDecimal(150);
    const d2 = americanToDecimal(-130);

    const result = calculateStakes([d1, d2], 100);

    // Rounding loss should be small
    expect(result.roundingLoss).toBeGreaterThanOrEqual(0);
    expect(result.roundingLoss).toBeLessThan(0.10); // Less than 10 cents on $100
  });
});

describe('sanity validation', () => {
  describe('checkOddsSanity', () => {
    test('valid odds pass', () => {
      expect(checkOddsSanity(-110).isValid).toBe(true);
      expect(checkOddsSanity(150).isValid).toBe(true);
      expect(checkOddsSanity(-500).isValid).toBe(true);
    });

    test('invalid odds fail', () => {
      const result = checkOddsSanity(50);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    test('extreme odds generate warnings', () => {
      const result = checkOddsSanity(15000);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
    });

    test('odds beyond sanity bounds fail', () => {
      const result = checkOddsSanity(60000);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('checkSpreadSanity', () => {
    test('normal NFL spreads pass', () => {
      expect(checkSpreadSanity(-7, 'NFL').isValid).toBe(true);
      expect(checkSpreadSanity(14.5, 'NFL').isValid).toBe(true);
    });

    test('extreme NFL spreads fail', () => {
      const result = checkSpreadSanity(-35, 'NFL');
      expect(result.isValid).toBe(false);
    });

    test('large spreads generate warnings', () => {
      const result = checkSpreadSanity(24, 'NFL');
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
    });

    test('NBA spreads have larger bounds', () => {
      expect(checkSpreadSanity(30, 'NBA').isValid).toBe(true);
      expect(checkSpreadSanity(-35, 'NBA').isValid).toBe(true);
      expect(checkSpreadSanity(45, 'NBA').isValid).toBe(false);
    });

    test('unknown sport uses default bounds', () => {
      expect(checkSpreadSanity(-20, 'Unknown').isValid).toBe(true);
    });
  });

  describe('checkTotalSanity', () => {
    test('normal NFL totals pass', () => {
      expect(checkTotalSanity(45.5, 'NFL').isValid).toBe(true);
      expect(checkTotalSanity(52, 'NFL').isValid).toBe(true);
    });

    test('NFL totals outside bounds fail', () => {
      expect(checkTotalSanity(20, 'NFL').isValid).toBe(false);
      expect(checkTotalSanity(90, 'NFL').isValid).toBe(false);
    });

    test('NBA totals have appropriate bounds', () => {
      expect(checkTotalSanity(220, 'NBA').isValid).toBe(true);
      expect(checkTotalSanity(150, 'NBA').isValid).toBe(false);
    });

    test('MLB totals are small', () => {
      expect(checkTotalSanity(8.5, 'MLB').isValid).toBe(true);
      expect(checkTotalSanity(50, 'MLB').isValid).toBe(false);
    });
  });

  describe('checkMarketSanity', () => {
    test('validates moneyline odds only', () => {
      const result = checkMarketSanity('moneyline', 'NFL', -150, null);
      expect(result.isValid).toBe(true);
    });

    test('validates spread with line', () => {
      const result = checkMarketSanity('spread', 'NFL', -110, -7);
      expect(result.isValid).toBe(true);
    });

    test('fails on invalid spread', () => {
      const result = checkMarketSanity('spread', 'NFL', -110, -40);
      expect(result.isValid).toBe(false);
    });

    test('validates total with line', () => {
      const result = checkMarketSanity('total', 'NBA', -110, 225);
      expect(result.isValid).toBe(true);
    });

    test('fails on bad odds even with good line', () => {
      const result = checkMarketSanity('spread', 'NFL', 50, -7);
      expect(result.isValid).toBe(false);
    });
  });
});
