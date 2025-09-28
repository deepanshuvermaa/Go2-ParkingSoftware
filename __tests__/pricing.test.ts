import { calculateAmountDue } from '@/utils/pricing';
import { PricingRule } from '@/types';
import { isoNow } from '@/utils/date';

const baseRule: PricingRule = {
  id: 'rule-1',
  name: 'Standard',
  baseRate: 5,
  hourlyRate: 3,
  gracePeriodMinutes: 10,
  active: true
};

describe('calculateAmountDue', () => {
  it('returns zero when within grace period', () => {
    const checkIn = isoNow();
    const amount = calculateAmountDue(checkIn, checkIn, baseRule);
    expect(amount).toBe(0);
  });

  it('applies base rate after grace period', () => {
    const checkIn = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    const amount = calculateAmountDue(isoNow(), checkIn, baseRule);
    expect(amount).toBe(baseRule.baseRate);
  });

  it('caps by max rate when provided', () => {
    const rule: PricingRule = { ...baseRule, maxRate: 10 };
    const checkIn = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    const amount = calculateAmountDue(isoNow(), checkIn, rule);
    expect(amount).toBe(rule.maxRate);
  });

  it('uses overnight flat rate when threshold reached', () => {
    const rule: PricingRule = { ...baseRule, overnightFlatRate: 25 };
    const checkIn = new Date(Date.now() - 13 * 60 * 60 * 1000).toISOString();
    const amount = calculateAmountDue(isoNow(), checkIn, rule);
    expect(amount).toBe(rule.overnightFlatRate);
  });
});
