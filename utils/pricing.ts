import { PricingRule } from '@/types';
import { durationMinutes } from '@/utils/date';

export const calculateAmountDue = (checkout: string, checkin: string, rule: PricingRule) => {
  const minutes = durationMinutes(checkin, checkout);
  if (minutes <= rule.gracePeriodMinutes) {
    return 0;
  }

  if (rule.overnightFlatRate && minutes >= 12 * 60) {
    return rule.overnightFlatRate;
  }

  const hours = Math.ceil((minutes - rule.gracePeriodMinutes) / 60);
  const amount = rule.baseRate + Math.max(0, hours - 1) * rule.hourlyRate;
  return rule.maxRate ? Math.min(amount, rule.maxRate) : amount;
};
