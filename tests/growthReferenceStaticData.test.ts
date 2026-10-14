import { describe, expect, it } from 'vitest';
import { STATIC_REFERENCE_FILES } from '@/app/api/utils/growth-reference-data';
import { lmsTableToRows } from '@/src/utils/growthReferences';

// Plausible medians (kg / cm) at 24 months, to catch unit or column mix-ups.
const MEDIAN_AT_24_MONTHS = {
  weight: [10, 15],
  length: [80, 95],
  head_circumference: [45, 52],
} as const;

describe('static growth reference data', () => {
  for (const file of STATIC_REFERENCE_FILES) {
    describe(file.id, () => {
      for (const [measurement, bySex] of Object.entries(file.lms)) {
        it(`${measurement}: both sexes, increasing ages, finite positive LMS`, () => {
          expect(Object.keys(bySex!).sort()).toEqual(['1', '2']);
          for (const table of Object.values(bySex!)) {
            expect(table.length).toBeGreaterThan(5);
            let repeatedAges = 0;
            for (let i = 0; i < table.length; i += 1) {
              const [age, l, m, s] = table[i];
              expect([age, l, m, s].every(Number.isFinite)).toBe(true);
              expect(m).toBeGreaterThan(0);
              expect(s).toBeGreaterThan(0);
              if (i > 0) expect(age).toBeGreaterThanOrEqual(table[i - 1][0]);
              if (i > 0 && age === table[i - 1][0]) repeatedAges += 1;
            }
            // Only a length table may repeat one age: the recumbent → standing switch.
            expect(repeatedAges).toBeLessThanOrEqual(measurement === 'length' ? 1 : 0);
          }
        });

        it(`${measurement}: ordered percentiles and a plausible median`, () => {
          for (const table of Object.values(bySex!)) {
            for (const row of lmsTableToRows(table as [number, number, number, number][])) {
              const columns = [row.p3, row.p5, row.p10, row.p25, row.p50, row.p75, row.p90, row.p95, row.p97];
              columns.slice(1).forEach((value, index) => expect(value).toBeGreaterThan(columns[index]));
            }
            const at24 = table.find(([age]) => Math.abs(age - 24) < 1e-6);
            if (at24) {
              const [min, max] = MEDIAN_AT_24_MONTHS[measurement as keyof typeof MEDIAN_AT_24_MONTHS];
              expect(at24[2]).toBeGreaterThan(min);
              expect(at24[2]).toBeLessThan(max);
            }
          }
        });
      }
    });
  }
});
