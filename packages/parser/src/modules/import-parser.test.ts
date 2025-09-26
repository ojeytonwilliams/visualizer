import { describe, it, expect } from 'vitest';
import { parse, resolveImportPath } from './import-parser.js';

describe('import-parser', () => {
  describe('parse', () => {
    const rootDir = '/path/to/project';
    it('should extract ES6 import statements', () => {
      const filename = './src/test.ts';
      const contents = `
        import React from 'react';
        import { useState, useEffect } from 'react';
        import * as lodash from 'lodash';
        import './styles.css';
        import { Component } from '../components/Component';
      `;

      const result = parse({ filename, contents, rootDir });

      expect(result).toEqual([
        'react',
        'react',
        'lodash',
        './src/styles.css',
        './components/Component',
      ]);
    });

    it('should extract CommonJS require statements', () => {
      const filename = './src/test.js';
      const contents = `
        const fs = require('fs');
        const path = require('path');
        const { promisify } = require('util');
        const customModule = require('./custom-module');
        const relativeModule = require('../lib/helper');
      `;

      const result = parse({ filename, contents, rootDir });

      expect(result).toEqual([
        'fs',
        'path',
        'util',
        './src/custom-module',
        './lib/helper',
      ]);
    });

    it('should extract mixed import and require statements', () => {
      const filename = './src/mixed.ts';
      const contents = `
        import express from 'express';
        const dotenv = require('dotenv');
        import { readFile } from 'fs/promises';
        const config = require('./config.json');
        import type { User } from '../types/User';
      `;

      const result = parse({ filename, contents, rootDir });

      expect(result).toEqual([
        'express',
        'dotenv',
        'fs/promises',
        './src/config.json',
        './types/User',
      ]);
    });

    it('should handle dynamic imports', () => {
      const filename = './dynamic.ts';
      const contents = `
        const module = await import('dynamic-module');
        import('lazy-loaded').then(mod => console.log(mod));
        const conditionalImport = condition ? import('./conditional') : null;
      `;

      const result = parse({ filename, contents, rootDir });

      expect(result).toEqual([
        'dynamic-module',
        'lazy-loaded',
        './conditional',
      ]);
    });

    it('should handle require calls in different contexts', () => {
      const filename = './contexts.js';
      const contents = `
        const main = require('main-module');
        function loadModule() {
          return require('function-scoped');
        }
        const conditional = condition && require('conditional-module');
        const computed = require(\`template-\${name}\`);
      `;

      const result = parse({ filename, contents, rootDir });

      expect(result).toEqual([
        'main-module',
        'function-scoped',
        'conditional-module',
        // Note: template literals with variables should be ignored as they can't be statically analyzed
      ]);
    });

    it('should ignore non-string import/require arguments', () => {
      const filename = './dir/invalid.ts';
      const contents = `
        import validImport from 'valid-module';
        const variable = 'module-name';
        const dynamicRequire = require(variable);
        const computedRequire = require(getModuleName());
        import('./static-string');
      `;

      const result = parse({ filename, contents, rootDir });

      expect(result).toEqual(['valid-module', './dir/static-string']);
    });

    it('should handle imports with side effects only', () => {
      const filename = './src/side-effects.ts';
      const contents = `
        import 'polyfill';
        import './init-script.js';
        import '../styles/global.css';
        require('side-effect-module');
      `;

      const result = parse({ filename, contents, rootDir });

      expect(result).toEqual([
        'polyfill',
        './src/init-script.js',
        './styles/global.css',
        'side-effect-module',
      ]);
    });

    it('should handle type-only imports', () => {
      const filename = './types.ts';
      const contents = `
        import type { User } from './types/User';
        import type { Config } from 'config-lib';
        import { type ApiResponse } from './api';
        import { useState, type Dispatch } from 'react';
      `;

      const result = parse({ filename, contents, rootDir });

      expect(result).toEqual(['./types/User', 'config-lib', './api', 'react']);
    });

    it('should return empty array for files with no imports', () => {
      const filename = './no-imports.ts';
      const contents = `
        const greeting = 'Hello, World!';
        function sayHello() {
          console.log(greeting);
        }
        export { sayHello };
      `;

      const result = parse({ filename, contents, rootDir });

      expect(result).toEqual([]);
    });

    it('should handle malformed or commented import statements', () => {
      const filename = './commented.ts';
      const contents = `
        import validModule from 'valid';
        // import commentedOut from 'commented';
        /* 
         * import blockCommented from 'block-commented';
         */
        // const commented = require('commented-require');
        const valid = require('valid-require');
      `;

      const result = parse({ filename, contents, rootDir });

      expect(result).toEqual(['valid', 'valid-require']);
    });

    it('should handle imports in strings and template literals correctly', () => {
      const filename = './strings.ts';
      const contents = `
        import realModule from 'real-module';
        const codeString = "import fake from 'fake-module';";
        const templateString = \`const fake = require('template-fake');\`;
        const jsxString = '<import src="not-real" />';
      `;

      const result = parse({ filename, contents, rootDir });

      expect(result).toEqual(['real-module']);
    });

    it('should handle export re-exports', () => {
      const filename = './src/re-exports.ts';
      const contents = `
        export { default } from 'external-lib';
        export * from './internal-module';
        export { namedExport } from '../utils/helpers';
        export type { TypeExport } from './types';
      `;

      const result = parse({ filename, contents, rootDir });

      expect(result).toEqual([
        'external-lib',
        './src/internal-module',
        './utils/helpers',
        './src/types',
      ]);
    });

    it('should throw if there is a relative import outside the project root', () => {
      const filename = './src/file.ts';
      const contents = `
        import outside from '../../outside';
      `;

      expect(() => parse({ filename, contents, rootDir })).toThrow(
        'Relative import "../../outside" in file "./src/file.ts" resolves outside the project root.'
      );
    });

    it('should resolve any relative imports', () => {
      const filename = './project/src/file.ts';
      const contents = `
        import valid from './valid';
        import parent from '../parent';
        import root from '../../root-level';
      `;

      const result = parse({ filename, contents, rootDir });

      expect(result).toEqual([
        './project/src/valid',
        './project/parent',
        './root-level',
      ]);
    });
  });

  describe('resolveImportPath', () => {
    const rootDir = '/path/to/project';
    it('should return sibling paths as-is', () => {
      expect(
        resolveImportPath('./sibling/path/module', './file.ts', rootDir)
      ).toBe('./sibling/path/module');
    });

    it('should return external package imports as-is', () => {
      expect(resolveImportPath('react', './file.ts', rootDir)).toBe('react');
    });

    it('should resolve parent directory imports correctly', () => {
      expect(
        resolveImportPath('../parent', './project/src/file.ts', rootDir)
      ).toBe('./project/parent');
    });

    it('should throw if the filename is absolute', () => {
      expect(() =>
        resolveImportPath('./sibling', '/project/src/file.ts', rootDir)
      ).toThrowError(
        'The file path "/project/src/file.ts" is absolute. All paths must be normalized and start with ./'
      );
    });

    it('should throw if the filename is not normalized', () => {
      expect(() =>
        resolveImportPath('./sibling', './src/../file.ts', rootDir)
      ).toThrowError(
        'The file path "./src/../file.ts" is not normalized. All paths must be normalized and start with ./'
      );
    });

    it('should throw if the filename contains any .. segments', () => {
      expect(() =>
        resolveImportPath('./sibling', './../file.ts', rootDir)
      ).toThrowError(
        'The file path "./../file.ts" is not fully specified. The file path cannot contain .. segments.'
      );
    });

    it('should throw if a relative import resolves outside the project root', () => {
      expect(() =>
        resolveImportPath('../../outside', './src/file.ts', rootDir)
      ).toThrowError(
        'Relative import "../../outside" in file "./src/file.ts" resolves outside the project root.'
      );
    });

    it('resolves relative imports', () => {
      expect(
        resolveImportPath('./module', './project/src/file.ts', rootDir)
      ).toBe('./project/src/module');
      expect(
        resolveImportPath('../../module', './project/src/file.ts', rootDir)
      ).toBe('./module');
    });

    it('handles files with leading .. in their names', () => {
      expect(
        resolveImportPath('./..module', './project/src/file.ts', rootDir)
      ).toBe('./project/src/..module');
      expect(
        resolveImportPath('../..module', './project/file.ts', rootDir)
      ).toBe('./..module');
    });
  });
});
