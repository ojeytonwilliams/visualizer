import { describe, it, expect, beforeEach, vi } from 'vitest';
import { vol } from 'memfs';
import { guessPossibleExtensions, parse } from './file-parser.js';
import type { ScannedFile } from './scanner.js';

// Mock fs to use memfs
vi.mock('fs');
vi.mock('fs/promises');

describe('file-parser', () => {
  beforeEach(() => {
    vol.reset();
  });

  describe('parse', () => {
    // TODO: consider how to handle the case where both .ts and .js versions of
    // a file exist. Is there a situation where you want to check both into
    // source control?
    it.todo(
      'should throw if an import resolves to multiple files',
      async () => {
        vol.fromJSON({
          '/project/src/app.ts': `
          import { helper } from './utils/helper.js';
        `,
          '/project/src/utils/helper.ts': 'export const helper = () => {};',
          '/project/src/utils/helper.js': 'export const helper = () => {};',
        });

        const scannedFiles: ScannedFile[] = [
          {
            rootDir: '/project',
            relativePath: './src/app.ts',
            extension: '.ts',
            name: 'app.ts',
          },
          {
            rootDir: '/project',
            relativePath: './src/utils/helper.ts',
            extension: '.ts',
            name: 'helper.ts',
          },
          {
            rootDir: '/project',
            relativePath: './src/utils/helper.js',
            extension: '.js',
            name: 'helper.js',
          },
        ];

        await expect(parse(scannedFiles)).rejects.toThrow(
          'Import ./utils/helper.js in ./src/app.ts resolves to multiple files'
        );
      }
    );

    it('should return empty nodes and links for empty input', async () => {
      const scannedFiles: ScannedFile[] = [];

      const result = await parse(scannedFiles);

      expect(result).toEqual({
        nodes: [],
        links: [],
      });
    });

    it('should create nodes from scanned files using relative paths as IDs', async () => {
      // Setup mock filesystem with test files
      vol.fromJSON({
        '/project/src/index.ts': 'export const hello = "world";',
        '/project/src/utils/api.ts': 'export function fetchData() {}',
        '/project/src/components/Login.tsx': 'export function Login() {}',
      });

      const scannedFiles: ScannedFile[] = [
        {
          rootDir: '/project',
          relativePath: './src/index.ts',
          extension: '.ts',
          name: 'index.ts',
        },
        {
          rootDir: '/project',
          relativePath: './src/utils/api.ts',
          extension: '.ts',
          name: 'api.ts',
        },
        {
          rootDir: '/project',
          relativePath: './src/components/Login.tsx',
          extension: '.tsx',
          name: 'Login.tsx',
        },
      ];

      const result = await parse(scannedFiles);

      expect(result.nodes).toEqual([
        { id: './src/index.ts' },
        { id: './src/utils/api.ts' },
        { id: './src/components/Login.tsx' },
      ]);
    });

    it('should create links based on import relationships', async () => {
      // Setup mock filesystem with files that import each other
      vol.fromJSON({
        '/project/src/index.ts': `
          import { Login } from './components/Login.tsx';
          export { Login };
        `,
        '/project/src/components/Login.tsx': `
          import { fetchData } from '../utils/api.ts';
          export function Login() {
            return fetchData();
          }
        `,
        '/project/src/utils/api.ts': `
          export function fetchData() {
            return fetch('/api/data');
          }
        `,
      });

      const scannedFiles: ScannedFile[] = [
        {
          rootDir: '/project',
          relativePath: './src/index.ts',
          extension: '.ts',
          name: 'index.ts',
        },
        {
          rootDir: '/project',
          relativePath: './src/components/Login.tsx',
          extension: '.tsx',
          name: 'Login.tsx',
        },
        {
          rootDir: '/project',
          relativePath: './src/utils/api.ts',
          extension: '.ts',
          name: 'api.ts',
        },
      ];

      const result = await parse(scannedFiles);

      expect(result.links).toEqual([
        {
          source: './src/index.ts',
          target: './src/components/Login.tsx',
        },
        {
          source: './src/components/Login.tsx',
          target: './src/utils/api.ts',
        },
      ]);
    });

    it('should handle .js imports of .ts files', async () => {
      vol.fromJSON({
        '/project/src/app.ts': `
          import { helper1 } from './utils/helper1.js';
        `,
        '/project/src/utils/helper1.ts': 'export const helper1 = () => {};',
      });

      const scannedFiles: ScannedFile[] = [
        {
          rootDir: '/project',
          relativePath: './src/app.ts',
          extension: '.ts',
          name: 'app.ts',
        },
        {
          rootDir: '/project',
          relativePath: './src/utils/helper1.ts',
          extension: '.ts',
          name: 'helper1.ts',
        },
      ];

      const result = await parse(scannedFiles);

      expect(result.links).toContainEqual({
        source: './src/app.ts',
        target: './src/utils/helper1.ts',
      });
    });

    it('should handle .jsx imports of .tsx files', async () => {
      vol.fromJSON({
        '/project/src/app.tsx': `
          import { Button } from './components/Button.jsx';
        `,
        '/project/src/components/Button.tsx': 'export const Button = () => {};',
      });

      const scannedFiles: ScannedFile[] = [
        {
          rootDir: '/project',
          relativePath: './src/app.tsx',
          extension: '.tsx',
          name: 'app.tsx',
        },
        {
          rootDir: '/project',
          relativePath: './src/components/Button.tsx',
          extension: '.tsx',
          name: 'Button.tsx',
        },
      ];

      const result = await parse(scannedFiles);

      expect(result.links).toContainEqual({
        source: './src/app.tsx',
        target: './src/components/Button.tsx',
      });
    });

    it('should ignore external package imports (node_modules)', async () => {
      vol.fromJSON({
        '/project/src/index.ts': `
          import React from 'react';
          import { fastify } from 'fastify';
          import { localUtil } from './utils/local.ts';
        `,
        '/project/src/utils/local.ts': 'export const localUtil = () => {};',
      });

      const scannedFiles: ScannedFile[] = [
        {
          rootDir: '/project',
          relativePath: './src/index.ts',
          extension: '.ts',
          name: 'index.ts',
        },
        {
          rootDir: '/project',
          relativePath: './src/utils/local.ts',
          extension: '.ts',
          name: 'local.ts',
        },
      ];

      const result = await parse(scannedFiles);

      // Should only include the local import, not external packages
      expect(result.links).toEqual([
        {
          source: './src/index.ts',
          target: './src/utils/local.ts',
        },
      ]);
    });

    it('should handle files with no imports', async () => {
      vol.fromJSON({
        '/project/src/standalone.ts':
          'export const standalone = "no imports here";',
      });

      const scannedFiles: ScannedFile[] = [
        {
          rootDir: '/project',
          relativePath: './src/standalone.ts',
          extension: '.ts',
          name: 'standalone.ts',
        },
      ];

      const result = await parse(scannedFiles);

      expect(result.nodes).toEqual([{ id: './src/standalone.ts' }]);
      expect(result.links).toEqual([]);
    });

    it('should handle imports to files that are not in scanned files list', async () => {
      vol.fromJSON({
        '/project/src/app.ts': `
          import { helper } from './helper.ts';
          import { external } from './not-scanned.ts';
        `,
        '/project/src/helper.ts': 'export const helper = () => {};',
        // Note: not-scanned.ts is not in the scanned files list
      });

      const scannedFiles: ScannedFile[] = [
        {
          rootDir: '/project',
          relativePath: './src/app.ts',
          extension: '.ts',
          name: 'app.ts',
        },
        {
          rootDir: '/project',
          relativePath: './src/helper.ts',
          extension: '.ts',
          name: 'helper.ts',
        },
      ];

      const result = await parse(scannedFiles);

      // Should only create links to files that are in the scanned files list
      expect(result.links).toEqual([
        {
          source: './src/app.ts',
          target: './src/helper.ts',
        },
      ]);
    });

    it('should handle complex project structure with nested imports', async () => {
      vol.fromJSON({
        '/project/src/index.ts': `
          import { Router } from './routes/router.ts';
          import { config } from './config/app.config.ts';
        `,
        '/project/src/routes/router.ts': `
          import { userController } from '../controllers/user.controller.ts';
        `,
        '/project/src/controllers/user.controller.ts': `
          import { userService } from '../services/user.service.ts';
        `,
        '/project/src/services/user.service.ts': `
          import { database } from '../utils/database.ts';
        `,
        '/project/src/utils/database.ts': 'export const database = {};',
        '/project/src/config/app.config.ts': 'export const config = {};',
      });

      const scannedFiles: ScannedFile[] = [
        {
          rootDir: '/project',
          relativePath: './src/index.ts',
          extension: '.ts',
          name: 'index.ts',
        },
        {
          rootDir: '/project',
          relativePath: './src/routes/router.ts',
          extension: '.ts',
          name: 'router.ts',
        },
        {
          rootDir: '/project',
          relativePath: './src/controllers/user.controller.ts',
          extension: '.ts',
          name: 'user.controller.ts',
        },
        {
          rootDir: '/project',
          relativePath: './src/services/user.service.ts',
          extension: '.ts',
          name: 'user.service.ts',
        },
        {
          rootDir: '/project',
          relativePath: './src/utils/database.ts',
          extension: '.ts',
          name: 'database.ts',
        },
        {
          rootDir: '/project',
          relativePath: './src/config/app.config.ts',
          extension: '.ts',
          name: 'app.config.ts',
        },
      ];

      const result = await parse(scannedFiles);

      expect(result.nodes).toHaveLength(6);
      expect(result.links).toEqual([
        { source: './src/index.ts', target: './src/routes/router.ts' },
        { source: './src/index.ts', target: './src/config/app.config.ts' },
        {
          source: './src/routes/router.ts',
          target: './src/controllers/user.controller.ts',
        },
        {
          source: './src/controllers/user.controller.ts',
          target: './src/services/user.service.ts',
        },
        {
          source: './src/services/user.service.ts',
          target: './src/utils/database.ts',
        },
      ]);
    });

    it('should handle CommonJS require statements in pure JS projects', async () => {
      vol.fromJSON({
        '/project/src/index.js': `
          const { helper } = require('./utils/helper');
          const config = require('./config');
          
          module.exports = { helper, config };
        `,
        '/project/src/utils/helper.js': `
          const database = require('../database');
          
          function helper() {
            return database.query();
          }
          
          module.exports = { helper };
        `,
        '/project/src/database.js': `
          module.exports = {
            query: () => 'data'
          };
        `,
        '/project/src/config.js': `
          module.exports = {
            apiUrl: 'http://localhost:3000'
          };
        `,
      });

      const scannedFiles: ScannedFile[] = [
        {
          rootDir: '/project',
          relativePath: './src/index.js',
          extension: '.js',
          name: 'index.js',
        },
        {
          rootDir: '/project',
          relativePath: './src/utils/helper.js',
          extension: '.js',
          name: 'helper.js',
        },
        {
          rootDir: '/project',
          relativePath: './src/database.js',
          extension: '.js',
          name: 'database.js',
        },
        {
          rootDir: '/project',
          relativePath: './src/config.js',
          extension: '.js',
          name: 'config.js',
        },
      ];

      const result = await parse(scannedFiles);

      expect(result.nodes).toHaveLength(4);
      expect(result.links).toEqual([
        { source: './src/index.js', target: './src/utils/helper.js' },
        { source: './src/index.js', target: './src/config.js' },
        { source: './src/utils/helper.js', target: './src/database.js' },
      ]);
    });
  });

  describe('guessPossibleExtensions', () => {
    it('should return add .js and .ts extensions for ./file.js imports', () => {
      const result = guessPossibleExtensions('./file.js');
      expect(result).toEqual(['./file.js', './file.ts']);
    });

    it('should return add .jsx and .tsx extensions for ./file.jsx imports', () => {
      const result = guessPossibleExtensions('./file.jsx');
      expect(result).toEqual(['./file.jsx', './file.tsx']);
    });

    it('should return add .cjs and .cts extensions for ./file.cjs imports', () => {
      const result = guessPossibleExtensions('./file.cjs');
      expect(result).toEqual(['./file.cjs', './file.cts']);
    });

    it('should return add .mjs and .mts extensions for ./file.mjs imports', () => {
      const result = guessPossibleExtensions('./file.mjs');
      expect(result).toEqual(['./file.mjs', './file.mts']);
    });

    it('should return index files for directory imports like ./dir/', () => {
      const result = guessPossibleExtensions('./dir/');
      expect(result).toEqual(['./dir/index.ts', './dir/index.js']);
    });

    // This isn't quite correct, because the real resolution algorithm checks in
    // a specific order, but this should work reasonably well for now.
    it('should return /pain/index.ts, pain.ts and pain.js for directory imports like ./pain', () => {
      const result = guessPossibleExtensions('./pain');
      expect(result).toEqual([
        './pain.ts',
        './pain.js',
        './pain/index.ts',
        './pain/index.js',
      ]);
    });

    it('should not modify the rest of the path', () => {
      const result = guessPossibleExtensions('./some/file.js');
      expect(result).toEqual(['./some/file.js', './some/file.ts']);
    });

    it('should handle absolute paths', () => {
      const result = guessPossibleExtensions('/absolute/path/file.jsx');
      expect(result).toEqual([
        '/absolute/path/file.jsx',
        '/absolute/path/file.tsx',
      ]);
    });
  });
});
