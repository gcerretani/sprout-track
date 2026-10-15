import prisma from '../db';
import { getGrowthReference } from '@/src/utils/growthReferenceRegistry';
import {
  createGrowthReferenceSegments,
  createStaticReferenceSegments,
  lmsTableToRows,
  type GrowthReferenceMeasurement,
  type GrowthReferenceRow,
  type GrowthReferenceSegment,
  type LmsTableRow,
} from '@/src/utils/growthReferences';
import itSiedp from '@/src/data/growth-references/it-siedp.json';
import itSiedpN from '@/src/data/growth-references/it-siedp-n.json';
import itSiedpS from '@/src/data/growth-references/it-siedp-s.json';
import deKiggs from '@/src/data/growth-references/de-kiggs.json';
import beFlanders from '@/src/data/growth-references/be-flanders.json';
import nl1997 from '@/src/data/growth-references/nl-1997.json';
import nl1997Tr from '@/src/data/growth-references/nl-1997-tr.json';
import nl1997Ma from '@/src/data/growth-references/nl-1997-ma.json';
import cn2005 from '@/src/data/growth-references/cn-2005.json';

/** Shape of src/data/growth-references/*.json: LMS rows by measurement, then sex ("1" male, "2" female). */
interface StaticReferenceFile {
  id: string;
  lms: Partial<Record<GrowthReferenceMeasurement, Record<string, number[][]>>>;
}

export const STATIC_REFERENCE_FILES: readonly StaticReferenceFile[] = [
  itSiedp, itSiedpN, itSiedpS, deKiggs, beFlanders, nl1997, nl1997Tr, nl1997Ma, cn2005,
];

const STATIC_BY_ID = new Map(STATIC_REFERENCE_FILES.map(file => [file.id, file]));

const SELECT_ROW = {
  ageMonths: true, l: true, m: true, s: true,
  p3: true, p5: true, p10: true, p25: true, p50: true, p75: true, p90: true, p95: true, p97: true,
} as const;

function staticRows(id: string, measurement: GrowthReferenceMeasurement, sex: number): GrowthReferenceRow[] {
  const table = STATIC_BY_ID.get(id)?.lms[measurement]?.[String(sex)] ?? [];
  return lmsTableToRows(table as unknown as LmsTableRow[]);
}

async function loadWhoRows(measurement: GrowthReferenceMeasurement, sex: number) {
  const query = { where: { sex }, orderBy: { ageMonths: 'asc' as const }, select: SELECT_ROW };
  switch (measurement) {
    case 'weight': return prisma.whoWeightForAge.findMany(query);
    case 'length': return prisma.whoLengthForAge.findMany(query);
    case 'head_circumference': return prisma.whoHeadCircumferenceForAge.findMany(query);
  }
}

async function loadCdcRows(measurement: GrowthReferenceMeasurement, sex: number) {
  const query = { where: { sex }, orderBy: { ageMonths: 'asc' as const }, select: SELECT_ROW };
  switch (measurement) {
    case 'weight':
      return Promise.all([prisma.cdcWeightForAge.findMany(query), prisma.cdcChildWeightForAge.findMany(query)]);
    case 'length':
      return Promise.all([prisma.cdcLengthForAge.findMany(query), prisma.cdcStatureForAge.findMany(query)]);
    case 'head_circumference':
      return [await prisma.cdcHeadCircumferenceForAge.findMany(query), []];
  }
}

/**
 * Age-bounded reference segments for one registry reference, measurement and
 * sex (1 = male, 2 = female). Callers validate the id and its availability for
 * the deployment mode first; an unknown id yields no segments.
 */
export async function loadGrowthReferenceSegments(
  id: string,
  measurement: GrowthReferenceMeasurement,
  sex: number,
): Promise<GrowthReferenceSegment[]> {
  const reference = getGrowthReference(id);
  if (!reference) return [];

  if (reference.id === 'WHO') {
    return createGrowthReferenceSegments('WHO', measurement, await loadWhoRows(measurement, sex));
  }
  if (reference.id === 'CDC') {
    const [primaryRows, childRows] = await loadCdcRows(measurement, sex);
    return createGrowthReferenceSegments('CDC', measurement, primaryRows, childRows);
  }

  const infantRows = reference.infantReferenceId === 'WHO' ? await loadWhoRows(measurement, sex) : [];
  return createStaticReferenceSegments(reference.id, measurement, staticRows(reference.id, measurement, sex), infantRows);
}
