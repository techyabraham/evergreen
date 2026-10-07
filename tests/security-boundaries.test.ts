import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : /\.(ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

describe('privileged data boundaries', () => {
  it('keeps the service client import inside the submission RPC module', () => {
    const hits = sourceFiles('lib').filter(file => readFileSync(file, 'utf8').includes("from '@/lib/security/service-client'"));
    expect(hits).toEqual([join('lib', 'data', 'public-submissions.ts')]);
  });

  it('does not request every site setting column in app code', () => {
    const hits = [...sourceFiles('app'), ...sourceFiles('lib'), ...sourceFiles('components')]
      .filter(file => /site_settings[\s\S]{0,80}\.select\(['"]\*['"]\)/.test(readFileSync(file, 'utf8')));
    expect(hits).toEqual([]);
  });
});
