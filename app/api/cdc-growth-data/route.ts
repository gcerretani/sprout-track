import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '../types';
import { withAuthContext, AuthResult } from '../utils/auth';
import { loadGrowthReferenceSegments } from '../utils/growth-reference-data';
import {
  isValidGrowthStandard,
  type GrowthStandard,
} from '@/src/utils/growthStandard';
import { deploymentModeFromEnv } from '@/src/utils/growthReferenceRegistry';
import type {
  GrowthReferenceMeasurement,
  GrowthReferenceSegment,
} from '@/src/utils/growthReferences';

export interface GrowthReferenceDataResponse {
  standard: GrowthStandard;
  measurementType: GrowthReferenceMeasurement;
  segments: GrowthReferenceSegment[];
}

const MEASUREMENT_TYPES: readonly GrowthReferenceMeasurement[] = [
  'weight',
  'length',
  'head_circumference',
];

function isValidMeasurementType(value: string | null): value is GrowthReferenceMeasurement {
  return value !== null && MEASUREMENT_TYPES.includes(value as GrowthReferenceMeasurement);
}

async function handleGet(req: NextRequest, authContext: AuthResult) {
  try {
    const { familyId: userFamilyId } = authContext;
    if (!userFamilyId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'User is not associated with a family.' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const sex = searchParams.get('sex'); // 1 = Male, 2 = Female
    const measurementTypeParam = searchParams.get('type'); // weight, length, head_circumference
    const standardParam = (searchParams.get('standard') || 'CDC').toUpperCase(); // growth reference id

    // References not licensed for commercial use are never served in SaaS mode.
    if (!isValidGrowthStandard(standardParam, deploymentModeFromEnv(process.env.DEPLOYMENT_MODE))) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'standard must be an available growth reference' },
        { status: 400 },
      );
    }

    if (!sex || !isValidMeasurementType(measurementTypeParam)) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'sex and a valid type (weight, length, or head_circumference) are required',
        },
        { status: 400 },
      );
    }

    const sexNum = parseInt(sex, 10);
    if (sexNum !== 1 && sexNum !== 2) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'sex must be 1 (Male) or 2 (Female)' },
        { status: 400 },
      );
    }

    const standard = standardParam;
    const segments = await loadGrowthReferenceSegments(standard, measurementTypeParam, sexNum);

    return NextResponse.json<ApiResponse<GrowthReferenceDataResponse>>(
      { success: true, data: { standard, measurementType: measurementTypeParam, segments } },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
    );
  } catch (error) {
    console.error('Error fetching growth reference data:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Failed to fetch growth reference data' },
      { status: 500 },
    );
  }
}

export const GET = withAuthContext(
  handleGet as (
    req: NextRequest,
    authContext: AuthResult,
  ) => Promise<NextResponse<ApiResponse<any>>>,
);
