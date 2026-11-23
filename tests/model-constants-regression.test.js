// tests/model-constants-regression.test.js
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  GEMINI_PRIMARY_MODEL,
  GEMINI_FALLBACK_MODEL,
  GEMINI_CANDIDATE_MODELS,
  GEMINI_GENERATION_CONFIG,
  FOGGY_FALLBACK_MODEL,
  FOGGY_PROVIDER_LABELS
} from '../shared/constants.js';
import * as chatModule from '../functions/api/chat.js';
import * as personalizeModule from '../functions/api/personalize.js';

describe('Model Constants & Gemini 1.5 Regression Guards', () => {
  it('exports required model constants and generation settings from shared/constants.js', () => {
    expect(GEMINI_PRIMARY_MODEL).toBe('gemini-3.1-flash-lite');
    expect(GEMINI_FALLBACK_MODEL).toBe('gemini-flash-latest');
    expect(Array.isArray(GEMINI_CANDIDATE_MODELS)).toBe(true);
    expect(GEMINI_CANDIDATE_MODELS).toContain(GEMINI_PRIMARY_MODEL);
    expect(GEMINI_CANDIDATE_MODELS).toContain(GEMINI_FALLBACK_MODEL);
    expect(GEMINI_GENERATION_CONFIG).toBeDefined();
    expect(GEMINI_GENERATION_CONFIG.temperature).toBe(0.3);
    expect(GEMINI_GENERATION_CONFIG.maxOutputTokens).toBe(1500);
    expect(GEMINI_GENERATION_CONFIG.timeoutMs || GEMINI_GENERATION_CONFIG.timeout).toBe(10000);
    expect(FOGGY_FALLBACK_MODEL).toBe('foggy-atmospheric-core');
    expect(FOGGY_PROVIDER_LABELS.LIVE_GEMINI).toBe('Google Gemini');
    expect(FOGGY_PROVIDER_LABELS.BUILT_IN_GUIDANCE).toBe("Answered by Foggy's built-in guidance");
  });

  it('ensures functions/api/chat.js and functions/api/personalize.js both expose model constants', () => {
    // Both chat and personalize handlers must export and share identical model constants
    expect(chatModule.GEMINI_PRIMARY_MODEL).toBe(GEMINI_PRIMARY_MODEL);
    expect(chatModule.GEMINI_FALLBACK_MODEL).toBe(GEMINI_FALLBACK_MODEL);
    expect(chatModule.GEMINI_CANDIDATE_MODELS).toEqual(GEMINI_CANDIDATE_MODELS);
    expect(chatModule.GEMINI_GENERATION_CONFIG).toEqual(GEMINI_GENERATION_CONFIG);
    expect(chatModule.FOGGY_FALLBACK_MODEL).toBe(FOGGY_FALLBACK_MODEL);
    expect(chatModule.FOGGY_PROVIDER_LABELS).toEqual(FOGGY_PROVIDER_LABELS);

    expect(personalizeModule.GEMINI_PRIMARY_MODEL).toBe(GEMINI_PRIMARY_MODEL);
    expect(personalizeModule.GEMINI_FALLBACK_MODEL).toBe(GEMINI_FALLBACK_MODEL);
    expect(personalizeModule.GEMINI_CANDIDATE_MODELS).toEqual(GEMINI_CANDIDATE_MODELS);
    expect(personalizeModule.GEMINI_GENERATION_CONFIG).toEqual(GEMINI_GENERATION_CONFIG);
    expect(personalizeModule.FOGGY_FALLBACK_MODEL).toBe(FOGGY_FALLBACK_MODEL);
    expect(personalizeModule.FOGGY_PROVIDER_LABELS).toEqual(FOGGY_PROVIDER_LABELS);
  });

  it('scans repo source and docs to verify no leftover Gemini 1.5 references exist', () => {
    const rootDir = path.resolve(__dirname, '..');
    const ignoredDirs = new Set([
      'node_modules',
      'dist',
      'build',
      'coverage',
      '.git',
      '.wrangler',
      '.pnpm-store'
    ]);

    const targetExtensions = new Set([
      '.js',
      '.jsx',
      '.ts',
      '.tsx',
      '.json',
      '.md',
      '.html',
      '.css',
      '.yml',
      '.yaml'
    ]);

    // Construct dynamically to avoid matching self
    const forbiddenPatterns = [
      'gemini' + '-1.5',
      'Gemini' + ' 1.5',
      '1.5' + '-flash',
      '1.5' + ' Flash'
    ];

    const violations = [];

    function walkDir(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (!ignoredDirs.has(entry.name)) {
            walkDir(path.join(dir, entry.name));
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          const fullPath = path.join(dir, entry.name);
          // Skip this regression test file itself
          if (fullPath === __filename) continue;

          if (targetExtensions.has(ext) || entry.name.startsWith('.')) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            for (const pattern of forbiddenPatterns) {
              if (content.toLowerCase().includes(pattern.toLowerCase())) {
                violations.push({
                  file: path.relative(rootDir, fullPath),
                  pattern
                });
              }
            }
          }
        }
      }
    }

    walkDir(rootDir);

    expect(
      violations,
      `Found leftover Gemini 1.5 references in: ${JSON.stringify(violations, null, 2)}`
    ).toEqual([]);
  });
});
