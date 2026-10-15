import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const dbMocks = vi.hoisted(() => ({
  babyCreate: vi.fn(),
  babyUpdate: vi.fn(),
  babyFindFirst: vi.fn(),
  familyFindUnique: vi.fn(),
  familyUpdate: vi.fn(),
}));

vi.mock('@/app/api/db', () => ({
  default: {
    baby: { create: dbMocks.babyCreate, update: dbMocks.babyUpdate, findFirst: dbMocks.babyFindFirst },
    family: { findUnique: dbMocks.familyFindUnique, update: dbMocks.familyUpdate },
  },
}));

vi.mock('@/app/api/utils/auth', () => ({
  withAuthContext: (handler: unknown) => handler,
  getAuthenticatedUser: async () => ({ authenticated: true, familyId: 'family-1' }),
}));

vi.mock('@/app/api/utils/writeProtection', () => ({
  checkWritePermission: () => ({ allowed: true }),
}));

import { POST, PUT } from '@/app/api/baby/route';
import { POST as CREATE } from '@/app/api/baby/create/route';
import type { AuthResult } from '@/app/api/utils/auth';

type Handler = (req: NextRequest, auth: AuthResult) => Promise<Response>;
const auth = { authenticated: true, familyId: 'family-1' } as AuthResult;

const baseBaby = {
  firstName: 'Ada',
  lastName: 'Test',
  birthDate: '2026-01-01T00:00:00.000Z',
  gender: 'FEMALE',
  feedWarningTime: '03:00',
  diaperWarningTime: '02:00',
};

const storedBaby = {
  id: 'baby-1',
  ...baseBaby,
  birthDate: new Date(baseBaby.birthDate),
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  familyId: 'family-1',
};

function request(url: string, method: string, body: unknown) {
  return new NextRequest(url, { method, body: JSON.stringify(body) });
}

const post = (body: unknown) =>
  (POST as unknown as Handler)(request('http://localhost/api/baby', 'POST', body), auth);
const put = (body: unknown) =>
  (PUT as unknown as Handler)(request('http://localhost/api/baby', 'PUT', body), auth);
const create = (body: unknown) =>
  (CREATE as unknown as (req: NextRequest) => Promise<Response>)(
    request('http://localhost/api/baby/create', 'POST', body),
  );

beforeEach(() => {
  vi.clearAllMocks();
  dbMocks.babyCreate.mockImplementation(async ({ data }) => ({ ...storedBaby, ...data }));
  dbMocks.babyUpdate.mockImplementation(async ({ data }) => ({ ...storedBaby, ...data }));
  dbMocks.babyFindFirst.mockResolvedValue(storedBaby);
  dbMocks.familyFindUnique.mockResolvedValue({ id: 'family-1', setupStage: 3 });
});

describe('POST /api/baby growthReference', () => {
  it.each(['CDC', 'WHO', null])('accepts %s', async (growthReference) => {
    const res = await post({ ...baseBaby, growthReference });
    expect(res.status).toBe(200);
    expect(dbMocks.babyCreate.mock.calls[0][0].data.growthReference).toBe(growthReference);
  });

  it('leaves the override unset when omitted', async () => {
    const res = await post(baseBaby);
    expect(res.status).toBe(200);
    expect(dbMocks.babyCreate.mock.calls[0][0].data).not.toHaveProperty('growthReference');
  });

  it.each(['FENTON', 'who', '', 42])('rejects %s', async (growthReference) => {
    const res = await post({ ...baseBaby, growthReference });
    expect(res.status).toBe(400);
    expect(dbMocks.babyCreate).not.toHaveBeenCalled();
  });
});

describe('PUT /api/baby growthReference', () => {
  it('sets and clears the override', async () => {
    expect((await put({ id: 'baby-1', growthReference: 'WHO' })).status).toBe(200);
    expect(dbMocks.babyUpdate.mock.calls[0][0].data.growthReference).toBe('WHO');

    expect((await put({ id: 'baby-1', growthReference: null })).status).toBe(200);
    expect(dbMocks.babyUpdate.mock.calls[1][0].data.growthReference).toBeNull();
  });

  it('rejects an unknown reference before touching the database', async () => {
    const res = await put({ id: 'baby-1', growthReference: 'UK-WHO' });
    expect(res.status).toBe(400);
    expect(dbMocks.babyFindFirst).not.toHaveBeenCalled();
    expect(dbMocks.babyUpdate).not.toHaveBeenCalled();
  });
});

describe('POST /api/baby/create growthReference', () => {
  const body = { ...baseBaby, familyId: 'family-1' };

  it.each(['WHO', null, undefined])('accepts %s', async (growthReference) => {
    const res = await create({ ...body, growthReference });
    expect(res.status).toBe(201);
  });

  it('rejects an unknown reference', async () => {
    const res = await create({ ...body, growthReference: 'INTERGROWTH' });
    expect(res.status).toBe(400);
    expect(dbMocks.babyCreate).not.toHaveBeenCalled();
  });
});

describe('growthReference and deployment mode', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('accepts registry references on self-hosted installs', async () => {
    expect((await post({ ...baseBaby, growthReference: 'IT-SIEDP' })).status).toBe(200);
    expect((await put({ id: 'baby-1', growthReference: 'NL-1997-TR' })).status).toBe(200);
  });

  it('rejects self-hosted-only references in SaaS mode on every write path', async () => {
    vi.stubEnv('DEPLOYMENT_MODE', 'saas');
    expect((await post({ ...baseBaby, growthReference: 'IT-SIEDP' })).status).toBe(400);
    expect((await put({ id: 'baby-1', growthReference: 'DE-KIGGS' })).status).toBe(400);
    expect((await create({ ...baseBaby, familyId: 'family-1', growthReference: 'BE-FLANDERS' })).status).toBe(400);
    expect((await put({ id: 'baby-1', growthReference: 'CN-2005' })).status).toBe(200);
    expect(dbMocks.babyCreate).not.toHaveBeenCalled();
  });
});
