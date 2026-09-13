import { describe, expect, it } from 'vitest';
import type { GrowthChartPoint, GrowthMetric } from '@/app/api/types';

describe('monthly report unsupported growth references', () => {
  it('represents an unavailable percentile as null instead of zero', () => {
    const metric: GrowthMetric = {
      value: 50,
      unit: 'cm',
      percentile: null,
      trend: 'stable',
    };
    expect(metric.percentile).toBeNull();
  });

  it('allows a raw measurement point without percentile curve values', () => {
    const point: GrowthChartPoint = {
      ageMonths: 40,
      measurement: 50,
      measurementDate: '2026-01-01T00:00:00.000Z',
    };
    expect(point.measurement).toBe(50);
    expect(point.percentile).toBeUndefined();
    expect(point.p50).toBeUndefined();
  });
});
