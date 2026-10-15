import { describe, it, expect } from 'vitest';
import {
  WHO_MAX_AGE_MONTHS,
  calculateGrowthAgeMonths,
  isValidGrowthStandard,
  effectiveGrowthStandard,
  resolveSelectedGrowthStandard,
  resolveGrowthStandard,
} from '@/src/utils/growthStandard';

describe('WHO_MAX_AGE_MONTHS', () => {
  it('is 24', () => {
    expect(WHO_MAX_AGE_MONTHS).toBe(24);
  });
});

describe('calculateGrowthAgeMonths', () => {
  it('preserves the fractional age immediately after the 24-month boundary', () => {
    const birth = new Date('2024-01-15T00:00:00.000Z');
    expect(calculateGrowthAgeMonths(birth, new Date('2026-01-15T00:00:00.000Z'))).toBe(24);
    expect(calculateGrowthAgeMonths(birth, new Date('2026-01-16T00:00:00.000Z'))).toBeGreaterThan(24);
  });

  it('does not drop back below a month boundary early in a short month', () => {
    const birth = new Date('2024-01-31T00:00:00.000Z');
    expect(calculateGrowthAgeMonths(birth, new Date('2026-01-31T00:00:00.000Z'))).toBe(24);
    expect(calculateGrowthAgeMonths(birth, new Date('2026-02-01T00:00:00.000Z'))).toBeGreaterThan(24);
  });

  it('never decreases day over day for end-of-month birthdays', () => {
    for (const birthIso of ['2024-01-31', '2024-03-31', '2024-01-30', '2024-02-29']) {
      const birth = new Date(`${birthIso}T00:00:00.000Z`);
      let prev = -1;
      for (let d = 0; d < 800; d++) {
        const target = new Date(birth.getTime() + d * 86_400_000);
        const age = calculateGrowthAgeMonths(birth, target);
        expect(age, `${birthIso} -> ${target.toISOString().slice(0, 10)}`).toBeGreaterThan(prev);
        prev = age;
      }
    }
  });
});

describe('isValidGrowthStandard', () => {
  it('accepts the two exact standards', () => {
    expect(isValidGrowthStandard('CDC')).toBe(true);
    expect(isValidGrowthStandard('WHO')).toBe(true);
  });

  it('rejects lowercase, empty, null, undefined, and unknown values', () => {
    expect(isValidGrowthStandard('cdc')).toBe(false);
    expect(isValidGrowthStandard('who')).toBe(false);
    expect(isValidGrowthStandard('')).toBe(false);
    expect(isValidGrowthStandard(null)).toBe(false);
    expect(isValidGrowthStandard(undefined)).toBe(false);
    expect(isValidGrowthStandard('BOTH')).toBe(false);
    expect(isValidGrowthStandard(1)).toBe(false);
  });
});

describe('effectiveGrowthStandard', () => {
  it('returns WHO when WHO is selected and age is within range', () => {
    expect(effectiveGrowthStandard('WHO', 0)).toBe('WHO');
    expect(effectiveGrowthStandard('WHO', 12)).toBe('WHO');
    expect(effectiveGrowthStandard('WHO', 24)).toBe('WHO');
  });

  it('falls back to CDC for the first fractional age above 24 months', () => {
    expect(effectiveGrowthStandard('WHO', 24.000001)).toBe('CDC');
    expect(effectiveGrowthStandard('WHO', 24.01)).toBe('CDC');
    expect(effectiveGrowthStandard('WHO', 30)).toBe('CDC');
  });

  it('works with the shared calendar-age calculation at the real boundary', () => {
    const birth = new Date('2024-01-15T00:00:00.000Z');
    const at24 = calculateGrowthAgeMonths(birth, new Date('2026-01-15T00:00:00.000Z'));
    const after24 = calculateGrowthAgeMonths(birth, new Date('2026-01-16T00:00:00.000Z'));
    expect(effectiveGrowthStandard('WHO', at24)).toBe('WHO');
    expect(effectiveGrowthStandard('WHO', after24)).toBe('CDC');
  });

  it('returns CDC whenever CDC is selected, at any age', () => {
    expect(effectiveGrowthStandard('CDC', 0)).toBe('CDC');
    expect(effectiveGrowthStandard('CDC', 24)).toBe('CDC');
    expect(effectiveGrowthStandard('CDC', 40)).toBe('CDC');
  });

  it('case-normalizes the selection', () => {
    expect(effectiveGrowthStandard(' who ', 10)).toBe('WHO');
    expect(effectiveGrowthStandard('Who', 10)).toBe('WHO');
  });

  it('defaults to CDC for null, undefined, empty, and unknown selections', () => {
    expect(effectiveGrowthStandard(null, 10)).toBe('CDC');
    expect(effectiveGrowthStandard(undefined, 10)).toBe('CDC');
    expect(effectiveGrowthStandard('', 10)).toBe('CDC');
    expect(effectiveGrowthStandard('STONE', 10)).toBe('CDC');
  });
});

describe('resolveSelectedGrowthStandard', () => {
  it('inherits the family default when the baby has no override', () => {
    expect(resolveSelectedGrowthStandard(null, 'WHO')).toEqual({ selected: 'WHO', source: 'family' });
    expect(resolveSelectedGrowthStandard(undefined, 'CDC')).toEqual({ selected: 'CDC', source: 'family' });
  });

  it('prefers the baby override over the family default', () => {
    expect(resolveSelectedGrowthStandard('CDC', 'WHO')).toEqual({ selected: 'CDC', source: 'baby' });
    expect(resolveSelectedGrowthStandard('WHO', 'CDC')).toEqual({ selected: 'WHO', source: 'baby' });
  });

  it('falls back to CDC when neither the baby nor the family has a usable value', () => {
    expect(resolveSelectedGrowthStandard(null, null)).toEqual({ selected: 'CDC', source: 'default' });
    expect(resolveSelectedGrowthStandard('', '  ')).toEqual({ selected: 'CDC', source: 'default' });
  });

  it('treats an unknown baby value as inherit rather than an error', () => {
    expect(resolveSelectedGrowthStandard('FENTON', 'WHO')).toEqual({ selected: 'WHO', source: 'family' });
    expect(resolveSelectedGrowthStandard('FENTON', 'UNKNOWN')).toEqual({ selected: 'CDC', source: 'default' });
  });

  it('normalizes case and whitespace like effectiveGrowthStandard', () => {
    expect(resolveSelectedGrowthStandard(' who ', 'CDC')).toEqual({ selected: 'WHO', source: 'baby' });
    expect(resolveSelectedGrowthStandard(null, 'who')).toEqual({ selected: 'WHO', source: 'family' });
  });

  it('resolves siblings independently against the same family default', () => {
    const family = 'CDC';
    expect(resolveSelectedGrowthStandard('WHO', family).selected).toBe('WHO');
    expect(resolveSelectedGrowthStandard(null, family).selected).toBe('CDC');
  });
});

describe('resolveGrowthStandard', () => {
  it('reports both the selected and the effective standard', () => {
    expect(resolveGrowthStandard('WHO', 'CDC', 12)).toEqual({ selected: 'WHO', source: 'baby', effective: 'WHO' });
  });

  it('keeps the selection but uses CDC once a WHO baby is past 24 months', () => {
    expect(resolveGrowthStandard('WHO', 'CDC', 24.01)).toEqual({ selected: 'WHO', source: 'baby', effective: 'CDC' });
    expect(resolveGrowthStandard(null, 'WHO', 30)).toEqual({ selected: 'WHO', source: 'family', effective: 'CDC' });
  });

  it('is backward compatible: no override behaves exactly like the family-only policy', () => {
    for (const family of ['CDC', 'WHO', 'who', null, undefined, 'BOGUS']) {
      for (const age of [0, 12, 24, 24.01, 36, 240]) {
        expect(resolveGrowthStandard(null, family, age).effective).toBe(
          effectiveGrowthStandard(family, age),
        );
      }
    }
  });
});
