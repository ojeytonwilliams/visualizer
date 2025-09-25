import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import * as path from 'path';
import { scanDirectory } from './scanner.js';

vi.mock('node:fs');
vi.mock('node:fs/promises');

describe('Directory Scanner', () => {
  const testDir = path.join(process.cwd(), 'test-fixture');

  beforeEach(async () => {
    // Create test directory structure
    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(path.join(testDir, 'src'), { recursive: true });
    await fs.mkdir(path.join(testDir, 'src', 'components'), {
      recursive: true,
    });
    await fs.mkdir(path.join(testDir, 'src', 'utils'), { recursive: true });
    await fs.mkdir(path.join(testDir, 'node_modules'), { recursive: true });
    await fs.mkdir(path.join(testDir, '.git'), { recursive: true });

    // Create test files
    await fs.writeFile(
      path.join(testDir, 'src', 'index.ts'),
      'export const main = () => {};'
    );
    await fs.writeFile(
      path.join(testDir, 'src', 'app.tsx'),
      'import React from "react";'
    );
    await fs.writeFile(
      path.join(testDir, 'src', 'config.js'),
      'module.exports = {};'
    );
    await fs.writeFile(
      path.join(testDir, 'src', 'types.jsx'),
      'export const Component = () => {};'
    );
    await fs.writeFile(
      path.join(testDir, 'src', 'components', 'Button.tsx'),
      'export const Button = () => {};'
    );
    await fs.writeFile(
      path.join(testDir, 'src', 'utils', 'helpers.ts'),
      'export const helper = () => {};'
    );

    // Create files that should be ignored
    await fs.writeFile(path.join(testDir, 'README.md'), '# Test Project');
    await fs.writeFile(path.join(testDir, 'package.json'), '{}');
    await fs.writeFile(path.join(testDir, 'src', 'styles.css'), 'body {}');
    await fs.writeFile(
      path.join(testDir, 'node_modules', 'package.js'),
      'ignored'
    );
    await fs.writeFile(path.join(testDir, '.git', 'config'), 'ignored');
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('scanDirectory', () => {
    it('should scan directory and return all source files', async () => {
      const files = await scanDirectory(testDir);

      expect(files).toHaveLength(6);
      expect(files.map(f => f.relativePath).sort()).toEqual([
        'src/app.tsx',
        'src/components/Button.tsx',
        'src/config.js',
        'src/index.ts',
        'src/types.jsx',
        'src/utils/helpers.ts',
      ]);
    });

    it('should return correct file information', async () => {
      const files = await scanDirectory(testDir);
      const indexFile = files.find(f => f.relativePath === 'src/index.ts');

      expect(indexFile).toBeDefined();
      expect(indexFile!.absolutePath).toBe(
        path.join(testDir, 'src', 'index.ts')
      );
      expect(indexFile!.extension).toBe('.ts');
      expect(indexFile!.name).toBe('index.ts');
    });

    it('should only include supported file extensions', async () => {
      const files = await scanDirectory(testDir);
      const extensions = files.map(f => f.extension);

      expect(extensions).toEqual(
        expect.arrayContaining(['.ts', '.tsx', '.js', '.jsx'])
      );
      expect(extensions).not.toEqual(
        expect.arrayContaining(['.md', '.json', '.css'])
      );
    });

    it('should ignore node_modules directory', async () => {
      const files = await scanDirectory(testDir);
      const nodeModulesFiles = files.filter(f =>
        f.relativePath.includes('node_modules')
      );

      expect(nodeModulesFiles).toHaveLength(0);
    });

    it('should ignore .git directory', async () => {
      const files = await scanDirectory(testDir);
      const gitFiles = files.filter(f => f.relativePath.includes('.git'));

      expect(gitFiles).toHaveLength(0);
    });

    it('should handle nested directories recursively', async () => {
      const files = await scanDirectory(testDir);
      const nestedFiles = files.filter(f => f.relativePath.includes('/'));

      expect(nestedFiles.length).toBeGreaterThan(0);
      expect(files.map(f => f.relativePath)).toContain(
        'src/components/Button.tsx'
      );
      expect(files.map(f => f.relativePath)).toContain('src/utils/helpers.ts');
    });

    it('should handle empty directory', async () => {
      const emptyDir = path.join(process.cwd(), 'empty-test-dir');
      await fs.mkdir(emptyDir, { recursive: true });

      const files = await scanDirectory(emptyDir);

      expect(files).toHaveLength(0);

      await fs.rm(emptyDir, { recursive: true });
    });

    it('should throw error for non-existent directory', async () => {
      const nonExistentDir = path.join(process.cwd(), 'non-existent-dir');

      await expect(scanDirectory(nonExistentDir)).rejects.toThrow();
    });

    it('should handle directory with no source files', async () => {
      const noSourceDir = path.join(process.cwd(), 'no-source-test-dir');
      await fs.mkdir(noSourceDir, { recursive: true });
      await fs.writeFile(path.join(noSourceDir, 'README.md'), '# Test');
      await fs.writeFile(path.join(noSourceDir, 'package.json'), '{}');

      const files = await scanDirectory(noSourceDir);

      expect(files).toHaveLength(0);

      await fs.rm(noSourceDir, { recursive: true });
    });
  });
});
