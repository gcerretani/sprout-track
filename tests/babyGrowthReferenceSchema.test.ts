import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '..');
const read = (file: string) => readFileSync(path.join(root, file), 'utf8');

// Postgres syncs via `prisma db push`, which cannot add a required column to a
// populated table; existing babies must also keep inheriting the family default.
describe('Baby.growthReference schema', () => {
  it('is an optional string with no default', () => {
    const babyModel = read('prisma/schema.prisma').match(/model Baby \{[\s\S]*?\n\}/)?.[0] ?? '';
    expect(babyModel).toMatch(/^\s*growthReference\s+String\?\s*(\/\/.*)?$/m);
  });

  it('has a SQLite migration adding a nullable column', () => {
    const sql = read('prisma/migrations/20261014000000_add_baby_growth_reference/migration.sql');
    expect(sql).toMatch(/ALTER TABLE "Baby" ADD COLUMN "growthReference" TEXT;/);
    expect(sql).not.toMatch(/NOT NULL|DEFAULT/);
  });
});
