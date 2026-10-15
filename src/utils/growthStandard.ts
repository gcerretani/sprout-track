/**
 * Pure policy for choosing a growth-chart reference standard.
 *
 * Each baby may override the family default (`Baby.growthReference`); null, an
 * unknown value, or a reference unavailable in this deployment mode inherits
 * `Settings.growthChartStandard`, then CDC. Valid ids come from the registry
 * (src/utils/growthReferenceRegistry.ts).
 *
 * WHO reference data covers 0–24 months. When a family selects WHO but the
 * relevant baby age exceeds 24 months, the whole chart/report falls back to CDC
 * (matching CDC clinical guidance: WHO for 0–24mo, CDC for 2+ years). The chart
 * still uses one standard at a time; CDC may internally select age-appropriate
 * infant or 2–20 year reference segments without mixing standards.
 */

import {
  getGrowthReference,
  isGrowthReferenceAvailable,
  type DeploymentMode,
} from './growthReferenceRegistry';

export const WHO_MAX_AGE_MONTHS = 24;

// A growth reference id from src/utils/growthReferenceRegistry.ts (e.g. 'CDC', 'WHO', 'IT-SIEDP').
export type GrowthStandard = string;

export const DEFAULT_GROWTH_STANDARD: GrowthStandard = 'CDC';

// Where the selected standard came from: the baby override, the family default, or the app default.
export type GrowthStandardSource = 'baby' | 'family' | 'default';

export function calculateGrowthAgeMonths(
  birthDateInput: Date | string,
  targetDateInput: Date | string,
): number {
  const birth = birthDateInput instanceof Date ? birthDateInput : new Date(birthDateInput);
  const target = targetDateInput instanceof Date ? targetDateInput : new Date(targetDateInput);
  if (Number.isNaN(birth.getTime()) || Number.isNaN(target.getTime())) return 0;

  // Month-anniversary n of the birth date, clamped to the month's last day
  // (a 31st birthday's February anniversary is the 28th/29th).
  const anniversary = (n: number) => {
    const month = birth.getUTCMonth() + n;
    const lastDay = new Date(Date.UTC(birth.getUTCFullYear(), month + 1, 0)).getUTCDate();
    return Date.UTC(birth.getUTCFullYear(), month, Math.min(birth.getUTCDate(), lastDay));
  };
  const targetDay = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate());

  let totalMonths =
    (target.getUTCFullYear() - birth.getUTCFullYear()) * 12 +
    target.getUTCMonth() - birth.getUTCMonth();
  if (targetDay < anniversary(totalMonths)) totalMonths -= 1;

  const start = anniversary(totalMonths);
  const dayFraction = (targetDay - start) / (anniversary(totalMonths + 1) - start);

  return Math.max(0, totalMonths + dayFraction);
}

// Registry membership (and availability in this deployment mode) for API validation. Ids are uppercase.
export function isValidGrowthStandard(
  value: unknown,
  mode: DeploymentMode = 'selfhosted',
): value is GrowthStandard {
  if (typeof value !== 'string') return false;
  const reference = getGrowthReference(value);
  return reference !== undefined && isGrowthReferenceAvailable(reference, mode);
}

// API validation for Baby.growthReference: null/undefined clears the override (inherit).
export function isValidGrowthReference(value: unknown, mode: DeploymentMode = 'selfhosted'): boolean {
  return value === null || value === undefined || isValidGrowthStandard(value, mode);
}

function normalizeGrowthStandard(
  value: string | null | undefined,
  mode: DeploymentMode,
): GrowthStandard | null {
  const normalized = (value || '').toUpperCase().trim();
  return isValidGrowthStandard(normalized, mode) ? normalized : null;
}

// Resolve the standard actually used for a selection at a baby age: a reference
// with an age limit (WHO, 24 months) hands over to its declared fallback (CDC).
export function effectiveGrowthStandard(
  selected: string | null | undefined,
  babyAgeMonths: number,
  mode: DeploymentMode = 'selfhosted',
): GrowthStandard {
  const reference = getGrowthReference(normalizeGrowthStandard(selected, mode));
  if (!reference) return DEFAULT_GROWTH_STANDARD;
  if (reference.maxAgeMonths !== undefined && babyAgeMonths > reference.maxAgeMonths) {
    return reference.fallbackId ?? DEFAULT_GROWTH_STANDARD;
  }
  return reference.id;
}

// The standard the user chose for this baby, before any age-based fallback.
// A reference unavailable in this deployment mode counts as unset (inherit).
export function resolveSelectedGrowthStandard(
  babyReference: string | null | undefined,
  familyDefault: string | null | undefined,
  mode: DeploymentMode = 'selfhosted',
): { selected: GrowthStandard; source: GrowthStandardSource } {
  const baby = normalizeGrowthStandard(babyReference, mode);
  if (baby) return { selected: baby, source: 'baby' };
  const family = normalizeGrowthStandard(familyDefault, mode);
  if (family) return { selected: family, source: 'family' };
  return { selected: DEFAULT_GROWTH_STANDARD, source: 'default' };
}

// Selected standard plus the one actually used at the given age (they differ when WHO falls back to CDC).
export function resolveGrowthStandard(
  babyReference: string | null | undefined,
  familyDefault: string | null | undefined,
  babyAgeMonths: number,
  mode: DeploymentMode = 'selfhosted',
): { selected: GrowthStandard; source: GrowthStandardSource; effective: GrowthStandard } {
  const resolved = resolveSelectedGrowthStandard(babyReference, familyDefault, mode);
  return { ...resolved, effective: effectiveGrowthStandard(resolved.selected, babyAgeMonths, mode) };
}
