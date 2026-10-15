import { describe, expect, it } from 'vitest';
import {
  GROWTH_REFERENCES,
  deploymentModeFromEnv,
  getGrowthReference,
  growthReferenceOptionLabel,
  listGrowthReferences,
} from '@/src/utils/growthReferenceRegistry';
import { STATIC_REFERENCE_FILES } from '@/app/api/utils/growth-reference-data';

describe('growth reference registry', () => {
  it('has unique uppercase ids with a citation and a licence note', () => {
    const ids = GROWTH_REFERENCES.map(reference => reference.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const reference of GROWTH_REFERENCES) {
      expect(reference.id).toBe(reference.id.toUpperCase());
      expect(reference.citation.length).toBeGreaterThan(20);
      expect(reference.license.length).toBeGreaterThan(10);
    }
  });

  it('ships exactly one static data file per static reference', () => {
    const staticIds = GROWTH_REFERENCES.filter(reference => reference.staticData).map(reference => reference.id);
    expect(STATIC_REFERENCE_FILES.map(file => file.id).sort()).toEqual(staticIds.sort());
  });

  it('declares fallback and infant references that exist', () => {
    for (const reference of GROWTH_REFERENCES) {
      if (reference.fallbackId) expect(getGrowthReference(reference.fallbackId)).toBeDefined();
      if (reference.infantReferenceId) expect(getGrowthReference(reference.infantReferenceId)).toBeDefined();
    }
  });

  it('hides self-hosted-only references in SaaS mode', () => {
    const saas = listGrowthReferences('saas').map(reference => reference.id);
    const selfhosted = listGrowthReferences('selfhosted').map(reference => reference.id);
    expect(saas).toEqual(['CDC', 'WHO', 'CN-2005']);
    expect(selfhosted).toEqual(GROWTH_REFERENCES.map(reference => reference.id));
  });

  it('treats only DEPLOYMENT_MODE=saas as SaaS', () => {
    expect(deploymentModeFromEnv('saas')).toBe('saas');
    expect(deploymentModeFromEnv(undefined)).toBe('selfhosted');
    expect(deploymentModeFromEnv('selfhosted')).toBe('selfhosted');
  });

  it('labels WHO with its coverage and translates the others', () => {
    const t = (key: string) => `t:${key}`;
    expect(growthReferenceOptionLabel(getGrowthReference('WHO')!, t)).toBe('WHO — t:0–24 months');
    expect(growthReferenceOptionLabel(getGrowthReference('IT-SIEDP')!, t)).toBe('t:Italy (SIEDP)');
  });
});
