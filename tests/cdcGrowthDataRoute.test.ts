import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import type { GrowthReferenceRow } from '@/src/utils/growthReferences';

const dbMocks = vi.hoisted(() => ({
  whoWeightForAge: vi.fn(),
  whoLengthForAge: vi.fn(),
  whoHeadCircumferenceForAge: vi.fn(),
  cdcWeightForAge: vi.fn(),
  cdcChildWeightForAge: vi.fn(),
  cdcLengthForAge: vi.fn(),
  cdcStatureForAge: vi.fn(),
  cdcHeadCircumferenceForAge: vi.fn(),
}));

vi.mock('@/app/api/db', () => ({
  default: {
    whoWeightForAge: { findMany: dbMocks.whoWeightForAge },
    whoLengthForAge: { findMany: dbMocks.whoLengthForAge },
    whoHeadCircumferenceForAge: { findMany: dbMocks.whoHeadCircumferenceForAge },
    cdcWeightForAge: { findMany: dbMocks.cdcWeightForAge },
    cdcChildWeightForAge: { findMany: dbMocks.cdcChildWeightForAge },
    cdcLengthForAge: { findMany: dbMocks.cdcLengthForAge },
    cdcStatureForAge: { findMany: dbMocks.cdcStatureForAge },
    cdcHeadCircumferenceForAge: { findMany: dbMocks.cdcHeadCircumferenceForAge },
  },
}));

vi.mock('@/app/api/utils/auth', () => ({
  withAuthContext: (handler: unknown) => handler,
}));

import { GET } from '@/app/api/cdc-growth-data/route';
import type { AuthResult } from '@/app/api/utils/auth';

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

async function call(type: string, standard = 'CDC') {
  const req = new NextRequest(
    `http://localhost/api/cdc-growth-data?sex=1&type=${type}&standard=${standard}`,
  );
  const handler = GET as unknown as (req: NextRequest, auth: AuthResult) => Promise<Response>;
  const response = await handler(req, { authenticated: true, familyId: 'family-1' });
  return { response, body: await response.json() as any };
}

beforeEach(() => {
  vi.clearAllMocks();
  Object.values(dbMocks).forEach(mock => mock.mockResolvedValue([]));
});

describe('GET /api/cdc-growth-data', () => {
  it('returns CDC infant and child weight segments split at 24 months', async () => {
    dbMocks.cdcWeightForAge.mockResolvedValue([row(23.5, 100), row(24.5, 100)]);
    dbMocks.cdcChildWeightForAge.mockResolvedValue([row(24, 200), row(60, 200), row(240, 200)]);

    const { response, body } = await call('weight');

    expect(response.status).toBe(200);
    expect(body.data.segments.map((segment: any) => ({
      id: segment.id,
      from: segment.effectiveFromMonths,
      to: segment.effectiveToMonths,
    }))).toEqual([
      { id: 'cdc-infant-weight', from: 0, to: 24 },
      { id: 'cdc-child-weight', from: 24, to: null },
    ]);
    expect(body.data.segments[1].rows.at(-1).ageMonths).toBe(240);
  });

  it('returns stature as the CDC child successor for length', async () => {
    dbMocks.cdcLengthForAge.mockResolvedValue([row(23.5, 100), row(24.5, 100)]);
    dbMocks.cdcStatureForAge.mockResolvedValue([row(24, 300), row(120, 300)]);

    const { body } = await call('length');

    expect(body.data.segments.map((segment: any) => segment.id)).toEqual([
      'cdc-infant-length',
      'cdc-child-stature',
    ]);
    expect(dbMocks.cdcStatureForAge).toHaveBeenCalledOnce();
  });

  it('returns only the infant head circumference dataset with no successor', async () => {
    dbMocks.cdcHeadCircumferenceForAge.mockResolvedValue([row(0), row(36)]);

    const { body } = await call('head_circumference');

    expect(body.data.segments).toHaveLength(1);
    expect(body.data.segments[0]).toMatchObject({
      id: 'cdc-infant-head-circumference',
      effectiveFromMonths: 0,
      effectiveToMonths: null,
    });
    expect(body.data.segments[0].rows.at(-1).ageMonths).toBe(36);
    expect(dbMocks.cdcStatureForAge).not.toHaveBeenCalled();
    expect(dbMocks.cdcChildWeightForAge).not.toHaveBeenCalled();
  });

  it('keeps WHO as one unswitched segment', async () => {
    dbMocks.whoWeightForAge.mockResolvedValue([row(0), row(24)]);

    const { body } = await call('weight', 'WHO');

    expect(body.data.standard).toBe('WHO');
    expect(body.data.segments).toHaveLength(1);
    expect(body.data.segments[0]).toMatchObject({
      id: 'who-weight',
      effectiveFromMonths: 0,
      effectiveToMonths: null,
    });
    expect(dbMocks.cdcWeightForAge).not.toHaveBeenCalled();
    expect(dbMocks.cdcChildWeightForAge).not.toHaveBeenCalled();
  });

  describe('registry references and deployment mode', () => {
    afterEach(() => vi.unstubAllEnvs());

    it('composes SIEDP from WHO under 2 years and the static table after', async () => {
      dbMocks.whoLengthForAge.mockResolvedValue([row(0, 50), row(24, 50)]);

      const { response, body } = await call('length', 'IT-SIEDP');

      expect(response.status).toBe(200);
      expect(body.data.segments.map((segment: any) => [segment.id, segment.effectiveFromMonths, segment.effectiveToMonths]))
        .toEqual([
          ['it-siedp-length-infant', 0, 24],
          ['it-siedp-length', 24, null],
        ]);
      expect(body.data.segments[1].rows[0]).toMatchObject({ ageMonths: 24, m: 88.8 });
      expect(dbMocks.cdcLengthForAge).not.toHaveBeenCalled();
    });

    it('serves static references without touching the database', async () => {
      const { body } = await call('weight', 'cn-2005');

      expect(body.data.standard).toBe('CN-2005');
      expect(body.data.segments[0].rows.length).toBeGreaterThan(20);
      Object.values(dbMocks).forEach(mock => expect(mock).not.toHaveBeenCalled());
    });

    it('refuses self-hosted-only references in SaaS mode but serves open ones', async () => {
      vi.stubEnv('DEPLOYMENT_MODE', 'saas');

      expect((await call('weight', 'IT-SIEDP')).response.status).toBe(400);
      expect((await call('weight', 'DE-KIGGS')).response.status).toBe(400);
      expect((await call('weight', 'CN-2005')).response.status).toBe(200);
      expect((await call('weight', 'WHO')).response.status).toBe(200);
    });

    it('rejects unknown references', async () => {
      expect((await call('weight', 'FENTON')).response.status).toBe(400);
    });
  });
});
