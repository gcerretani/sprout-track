/**
 * Registry of selectable growth references (issue #292).
 *
 * Metadata only — safe for client and server. Reference data lives in the
 * database (CDC, WHO) or in src/data/growth-references/*.json (see the README
 * there for provenance and licensing), loaded server-side by
 * app/api/utils/growth-reference-data.ts.
 *
 * `availability` gates where a reference may be selected and served:
 * 'selfhosted' references are never offered or served when
 * DEPLOYMENT_MODE=saas, because their licence does not clearly allow
 * commercial use (pending permission from the rights holders).
 */
import type { GrowthReferenceMeasurement } from './growthReferences';

export type DeploymentMode = 'saas' | 'selfhosted';
export type GrowthReferenceAvailability = 'all' | 'selfhosted';

export interface GrowthReferenceDefinition {
  /** Stored in Baby.growthReference / Settings.growthChartStandard. Uppercase. */
  readonly id: string;
  /** Selector label; English text doubles as the translation key. */
  readonly label: string;
  /** Compact name used in chart titles (not translated). */
  readonly shortLabel: string;
  readonly measurements: readonly GrowthReferenceMeasurement[];
  /** Bibliographic citation shown with the chart (not translated). */
  readonly citation: string;
  /** Licence / rights status of the data, as far as known. */
  readonly license: string;
  readonly availability: GrowthReferenceAvailability;
  /** Data lives in a static JSON file (otherwise in the database). */
  readonly staticData?: boolean;
  /** Below the static data's first age, use this reference's rows (e.g. WHO under 2 years). */
  readonly infantReferenceId?: string;
  /** Past this age the reference is not used at all and `fallbackId` takes over. */
  readonly maxAgeMonths?: number;
  readonly fallbackId?: string;
}

const CHILDSDS_NOTE = 'Parameters as published; values extracted from the childsds R package 0.9.11.';

export const GROWTH_REFERENCES: readonly GrowthReferenceDefinition[] = [
  {
    id: 'CDC',
    label: 'CDC',
    shortLabel: 'CDC',
    measurements: ['weight', 'length', 'head_circumference'],
    citation: 'CDC Growth Charts 2000 (Kuczmarski RJ et al., Vital Health Stat 11(246), 2002).',
    license: 'U.S. government work, public domain.',
    availability: 'all',
  },
  {
    id: 'WHO',
    label: 'WHO',
    shortLabel: 'WHO',
    measurements: ['weight', 'length', 'head_circumference'],
    citation: 'WHO Child Growth Standards (WHO Multicentre Growth Reference Study Group, 2006).',
    license: '© World Health Organization.',
    availability: 'all',
    maxAgeMonths: 24,
    fallbackId: 'CDC',
  },
  {
    id: 'IT-SIEDP',
    label: 'Italy (SIEDP)',
    shortLabel: 'SIEDP',
    measurements: ['weight', 'length', 'head_circumference'],
    citation: 'Cacciari E et al. Italian cross-sectional growth charts for height, weight and BMI (2 to 20 yr). J Endocrinol Invest 2006;29:581–93. Under 2 years: WHO Child Growth Standards 2006.',
    license: `Rights not stated by SIEDP. ${CHILDSDS_NOTE}`,
    availability: 'selfhosted',
    staticData: true,
    infantReferenceId: 'WHO',
  },
  {
    id: 'IT-SIEDP-N',
    label: 'Northern Italy (SIEDP)',
    shortLabel: 'SIEDP North',
    measurements: ['weight', 'length', 'head_circumference'],
    citation: 'Cacciari E et al. Italian cross-sectional growth charts for height, weight and BMI (2 to 20 yr). J Endocrinol Invest 2006;29:581–93 (Centre-North). Under 2 years: WHO Child Growth Standards 2006.',
    license: `Rights not stated by SIEDP. ${CHILDSDS_NOTE}`,
    availability: 'selfhosted',
    staticData: true,
    infantReferenceId: 'WHO',
  },
  {
    id: 'IT-SIEDP-S',
    label: 'Southern Italy (SIEDP)',
    shortLabel: 'SIEDP South',
    measurements: ['weight', 'length', 'head_circumference'],
    citation: 'Cacciari E et al. Italian cross-sectional growth charts for height, weight and BMI (2 to 20 yr). J Endocrinol Invest 2006;29:581–93 (South). Under 2 years: WHO Child Growth Standards 2006.',
    license: `Rights not stated by SIEDP. ${CHILDSDS_NOTE}`,
    availability: 'selfhosted',
    staticData: true,
    infantReferenceId: 'WHO',
  },
  {
    id: 'DE-KIGGS',
    label: 'Germany (KiGGS)',
    shortLabel: 'KiGGS',
    measurements: ['weight', 'length', 'head_circumference'],
    citation: 'Robert Koch-Institut. Referenzperzentile für anthropometrische Maßzahlen und Blutdruck aus der Studie zur Gesundheit von Kindern und Jugendlichen in Deutschland (KiGGS) 2003–2006. 2nd ed., 2013.',
    license: `© Robert Koch-Institut; no open licence stated. ${CHILDSDS_NOTE}`,
    availability: 'selfhosted',
    staticData: true,
  },
  {
    id: 'BE-FLANDERS',
    label: 'Belgium (Flanders)',
    shortLabel: 'Flanders',
    measurements: ['weight', 'length', 'head_circumference'],
    citation: 'Roelants M, Hauspie R, Hoppenbrouwers K. References for growth and pubertal development from birth to 21 years in Flanders, Belgium. Ann Hum Biol 2009;36:680–94.',
    license: `Journal article (Taylor & Francis); no open licence stated. ${CHILDSDS_NOTE}`,
    availability: 'selfhosted',
    staticData: true,
  },
  {
    id: 'NL-1997',
    label: 'Netherlands',
    shortLabel: 'NL 1997',
    measurements: ['weight', 'length', 'head_circumference'],
    citation: 'Fredriks AM et al. Continuing positive secular growth change in The Netherlands 1955–1997. Pediatr Res 2000;47:316–23.',
    license: `TNO; no open licence stated. ${CHILDSDS_NOTE}`,
    availability: 'selfhosted',
    staticData: true,
  },
  {
    id: 'NL-1997-TR',
    label: 'Netherlands (Turkish origin)',
    shortLabel: 'NL Turkish origin',
    measurements: ['weight', 'length', 'head_circumference'],
    citation: 'Fredriks AM et al. Height, weight, body mass index and pubertal development reference values for children of Turkish origin in the Netherlands. Eur J Pediatr 2003;162:788–93.',
    license: `TNO; no open licence stated. ${CHILDSDS_NOTE}`,
    availability: 'selfhosted',
    staticData: true,
  },
  {
    id: 'NL-1997-MA',
    label: 'Netherlands (Moroccan origin)',
    shortLabel: 'NL Moroccan origin',
    measurements: ['weight', 'length', 'head_circumference'],
    citation: 'Fredriks AM et al. Height, weight, body mass index and pubertal development references for children of Moroccan origin in The Netherlands. Acta Paediatr 2004;93:817–24.',
    license: `TNO; no open licence stated. ${CHILDSDS_NOTE}`,
    availability: 'selfhosted',
    staticData: true,
  },
  {
    id: 'CN-2005',
    label: 'China',
    shortLabel: 'China 2005',
    measurements: ['weight', 'length', 'head_circumference'],
    citation: 'Zong XN, Li H. Construction of a new growth references for China based on urban Chinese children: comparison with the WHO growth standards. PLoS ONE 2013;8:e59569.',
    license: `Creative Commons Attribution (CC BY), PLOS ONE. ${CHILDSDS_NOTE}`,
    availability: 'all',
    staticData: true,
  },
];

const BY_ID = new Map(GROWTH_REFERENCES.map(reference => [reference.id, reference]));

export function getGrowthReference(id: string | null | undefined): GrowthReferenceDefinition | undefined {
  return id ? BY_ID.get(id) : undefined;
}

export function deploymentModeFromEnv(value: string | null | undefined): DeploymentMode {
  return value === 'saas' ? 'saas' : 'selfhosted';
}

export function isGrowthReferenceAvailable(
  reference: GrowthReferenceDefinition,
  mode: DeploymentMode,
): boolean {
  return reference.availability === 'all' || mode === 'selfhosted';
}

export function listGrowthReferences(mode: DeploymentMode): GrowthReferenceDefinition[] {
  return GROWTH_REFERENCES.filter(reference => isGrowthReferenceAvailable(reference, mode));
}

/** Selector label; WHO notes its 0–24 month coverage. */
export function growthReferenceOptionLabel(
  reference: GrowthReferenceDefinition,
  t: (key: string) => string,
): string {
  return reference.id === 'WHO' ? `WHO — ${t('0–24 months')}` : t(reference.label);
}
