import type { GrowthStandard } from './growthStandard';

export type GrowthReferenceMeasurement = 'weight' | 'length' | 'head_circumference';

export interface GrowthReferenceRow {
  ageMonths: number;
  l: number;
  m: number;
  s: number;
  p3: number;
  p5: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p97: number;
}

/**
 * A reference segment separates the age interval where a dataset is the
 * selected policy from the raw age range physically present in that dataset.
 *
 * `effectiveToMonths` is exclusive. A null upper bound means that policy does
 * not switch to another segment; raw row bounds still limit interpolation.
 */
export interface GrowthReferenceSegment {
  id: string;
  standard: GrowthStandard;
  measurement: GrowthReferenceMeasurement;
  effectiveFromMonths: number;
  effectiveToMonths: number | null;
  rows: readonly GrowthReferenceRow[];
}

export interface ResolvedGrowthReference {
  segment: GrowthReferenceSegment;
  row: GrowthReferenceRow;
}

const INTERPOLATED_FIELDS = [
  'l',
  'm',
  's',
  'p3',
  'p5',
  'p10',
  'p25',
  'p50',
  'p75',
  'p90',
  'p95',
  'p97',
] as const satisfies readonly (keyof GrowthReferenceRow)[];

function hasFiniteValues(row: GrowthReferenceRow): boolean {
  return (
    Number.isFinite(row.ageMonths) &&
    INTERPOLATED_FIELDS.every(field => Number.isFinite(row[field]))
  );
}

/**
 * Select the single reference segment whose effective policy range contains
 * the requested age. Ambiguous or unsupported configurations fail closed.
 */
export function selectGrowthReferenceSegment(
  segments: readonly GrowthReferenceSegment[],
  standard: GrowthStandard,
  measurement: GrowthReferenceMeasurement,
  ageMonths: number,
): GrowthReferenceSegment | null {
  if (!Number.isFinite(ageMonths)) return null;

  const matches = segments.filter(segment => {
    if (segment.standard !== standard || segment.measurement !== measurement) return false;
    if (ageMonths < segment.effectiveFromMonths) return false;
    return segment.effectiveToMonths === null || ageMonths < segment.effectiveToMonths;
  });

  return matches.length === 1 ? matches[0] : null;
}

/**
 * Interpolate a reference row only when the requested age is bounded by rows
 * from the same dataset. Ages before the first row or after the last row are
 * unsupported: the first/last LMS row is never reused as extrapolated data.
 */
export function interpolateGrowthReferenceRow(
  rows: readonly GrowthReferenceRow[],
  ageMonths: number,
): GrowthReferenceRow | null {
  if (!Number.isFinite(ageMonths)) return null;

  const sortedRows = rows
    .filter(hasFiniteValues)
    .slice()
    .sort((a, b) => a.ageMonths - b.ageMonths);
  if (sortedRows.length === 0) return null;

  const exact = sortedRows.find(row => row.ageMonths === ageMonths);
  if (exact) return exact;

  const first = sortedRows[0];
  const last = sortedRows[sortedRows.length - 1];
  if (ageMonths < first.ageMonths || ageMonths > last.ageMonths) return null;

  let lower: GrowthReferenceRow | undefined;
  let upper: GrowthReferenceRow | undefined;

  for (const row of sortedRows) {
    if (row.ageMonths < ageMonths) lower = row;
    if (row.ageMonths > ageMonths) {
      upper = row;
      break;
    }
  }

  if (!lower || !upper || upper.ageMonths === lower.ageMonths) return null;

  const ratio = (ageMonths - lower.ageMonths) / (upper.ageMonths - lower.ageMonths);
  const interpolated = { ageMonths } as GrowthReferenceRow;

  for (const field of INTERPOLATED_FIELDS) {
    interpolated[field] = lower[field] + ratio * (upper[field] - lower[field]);
  }

  return interpolated;
}

/**
 * Resolve `standard + measurement + age` by selecting the policy segment
 * first, then performing bounded interpolation only within that segment's raw
 * rows. This prevents interpolation across two distinct reference datasets.
 */
export function resolveGrowthReference(
  segments: readonly GrowthReferenceSegment[],
  standard: GrowthStandard,
  measurement: GrowthReferenceMeasurement,
  ageMonths: number,
): ResolvedGrowthReference | null {
  const segment = selectGrowthReferenceSegment(segments, standard, measurement, ageMonths);
  if (!segment) return null;

  const row = interpolateGrowthReferenceRow(segment.rows, ageMonths);
  return row ? { segment, row } : null;
}
