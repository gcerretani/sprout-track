import { describe, expect, it } from 'vitest';
import {
  interpolateGrowthReferenceRow,
  resolveGrowthReference,
  selectGrowthReferenceSegment,
  type GrowthReferenceRow,
  type GrowthReferenceSegment,
} from '@/src/utils/growthReferences';

function row(ageMonths: number, base = 0): GrowthReferenceRow {
  const value = base + ageMonths;
  return {
    ageMonths,
    l: value,
    m: value,
    s: value,
    p3: value,
    p5: value,
    p10: value,
    p25: value,
    p50: value,
    p75: value,
    p90: value,
    p95: value,
    p97: value,
  };
}

const cdcWeightSegments: GrowthReferenceSegment[] = [
  {
    id: 'cdc-infant-weight',
    standard: 'CDC',
    measurement: 'weight',
    effectiveFromMonths: 0,
    effectiveToMonths: 24,
    rows: [row(23.5, 100), row(24.5, 100)],
  },
  {
    id: 'cdc-child-weight',
    standard: 'CDC',
    measurement: 'weight',
    effectiveFromMonths: 24,
    effectiveToMonths: null,
    rows: [row(24, 200), row(24.5, 200), row(240, 200)],
  },
];

describe('selectGrowthReferenceSegment', () => {
  it('uses the infant segment immediately before the transition', () => {
    expect(selectGrowthReferenceSegment(cdcWeightSegments, 'CDC', 'weight', 23.9)?.id).toBe(
      'cdc-infant-weight',
    );
  });

  it('switches to the child segment exactly at 24 months', () => {
    expect(selectGrowthReferenceSegment(cdcWeightSegments, 'CDC', 'weight', 24)?.id).toBe(
      'cdc-child-weight',
    );
    expect(selectGrowthReferenceSegment(cdcWeightSegments, 'CDC', 'weight', 24.1)?.id).toBe(
      'cdc-child-weight',
    );
  });

  it('returns null for an unsupported standard or measurement', () => {
    expect(selectGrowthReferenceSegment(cdcWeightSegments, 'WHO', 'weight', 12)).toBeNull();
    expect(selectGrowthReferenceSegment(cdcWeightSegments, 'CDC', 'length', 12)).toBeNull();
  });

  it('fails closed when overlapping effective ranges are ambiguous', () => {
    const overlapping = [
      ...cdcWeightSegments,
      {
        ...cdcWeightSegments[0],
        id: 'duplicate-infant-weight',
      },
    ];

    expect(selectGrowthReferenceSegment(overlapping, 'CDC', 'weight', 12)).toBeNull();
  });
});

describe('interpolateGrowthReferenceRow', () => {
  it('returns exact rows at supported boundaries', () => {
    const rows = [row(10), row(20)];
    expect(interpolateGrowthReferenceRow(rows, 10)).toEqual(row(10));
    expect(interpolateGrowthReferenceRow(rows, 20)).toEqual(row(20));
  });

  it('interpolates all LMS and percentile fields inside a dataset', () => {
    const result = interpolateGrowthReferenceRow([row(10), row(20)], 15);
    expect(result).toEqual(row(15));
  });

  it('never reuses the first or last row outside the raw data range', () => {
    const rows = [row(10), row(20)];
    expect(interpolateGrowthReferenceRow(rows, 9.99)).toBeNull();
    expect(interpolateGrowthReferenceRow(rows, 20.01)).toBeNull();
  });

  it('does not mutate the input row order', () => {
    const rows = [row(20), row(10)];
    interpolateGrowthReferenceRow(rows, 15);
    expect(rows.map(item => item.ageMonths)).toEqual([20, 10]);
  });
});

describe('resolveGrowthReference', () => {
  it('selects a segment before interpolation, so datasets are never blended', () => {
    const beforeTransition = resolveGrowthReference(cdcWeightSegments, 'CDC', 'weight', 23.9);
    const atTransition = resolveGrowthReference(cdcWeightSegments, 'CDC', 'weight', 24);

    expect(beforeTransition?.segment.id).toBe('cdc-infant-weight');
    expect(beforeTransition?.row.m).toBeCloseTo(123.9, 10);

    expect(atTransition?.segment.id).toBe('cdc-child-weight');
    expect(atTransition?.row.m).toBe(224);
  });

  it('can use raw infant rows beyond the effective transition to interpolate just before it', () => {
    const result = resolveGrowthReference(cdcWeightSegments, 'CDC', 'weight', 23.99);

    expect(result?.segment.id).toBe('cdc-infant-weight');
    expect(result?.row.m).toBeCloseTo(123.99, 10);
  });

  it('returns null beyond the raw maximum even when the policy segment has no upper switch', () => {
    expect(resolveGrowthReference(cdcWeightSegments, 'CDC', 'weight', 240)?.row.m).toBe(440);
    expect(resolveGrowthReference(cdcWeightSegments, 'CDC', 'weight', 240.01)).toBeNull();
  });

  it('supports a no-successor reference while still respecting its raw maximum', () => {
    const headCircumferenceSegments: GrowthReferenceSegment[] = [
      {
        id: 'cdc-infant-head-circumference',
        standard: 'CDC',
        measurement: 'head_circumference',
        effectiveFromMonths: 0,
        effectiveToMonths: null,
        rows: [row(0), row(36)],
      },
    ];

    expect(
      resolveGrowthReference(headCircumferenceSegments, 'CDC', 'head_circumference', 36),
    ).not.toBeNull();
    expect(
      resolveGrowthReference(headCircumferenceSegments, 'CDC', 'head_circumference', 36.01),
    ).toBeNull();
  });
});
