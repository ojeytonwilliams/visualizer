import { describe, it, expect } from 'vitest';
import { parse } from './import-parser.js';

describe('import-parser', () => {
  describe('parse function', () => {
    it('should extract ES6 import statements', () => {
      const filename = 'test.ts';
      const contents = `
        import React from 'react';
        import { useState, useEffect } from 'react';
        import * as lodash from 'lodash';
        import './styles.css';
        import { Component } from '../components/Component';
      `;
      
      const result = parse({ filename, contents });
      
      expect(result).toEqual([
        'react',
        'react',
        'lodash',
        './styles.css',
        '../components/Component'
      ]);
    });

    it('should extract CommonJS require statements', () => {
      const filename = 'test.js';
      const contents = `
        const fs = require('fs');
        const path = require('path');
        const { promisify } = require('util');
        const customModule = require('./custom-module');
        const relativeModule = require('../lib/helper');
      `;
      
      const result = parse({ filename, contents });
      
      expect(result).toEqual([
        'fs',
        'path',
        'util',
        './custom-module',
        '../lib/helper'
      ]);
    });

    it('should extract mixed import and require statements', () => {
      const filename = 'mixed.ts';
      const contents = `
        import express from 'express';
        const dotenv = require('dotenv');
        import { readFile } from 'fs/promises';
        const config = require('./config.json');
        import type { User } from '../types/User';
      `;
      
      const result = parse({ filename, contents });
      
      expect(result).toEqual([
        'express',
        'dotenv',
        'fs/promises',
        './config.json',
        '../types/User'
      ]);
    });

    it('should handle dynamic imports', () => {
      const filename = 'dynamic.ts';
      const contents = `
        const module = await import('dynamic-module');
        import('lazy-loaded').then(mod => console.log(mod));
        const conditionalImport = condition ? import('./conditional') : null;
      `;
      
      const result = parse({ filename, contents });
      
      expect(result).toEqual([
        'dynamic-module',
        'lazy-loaded',
        './conditional'
      ]);
    });

    it('should handle require calls in different contexts', () => {
      const filename = 'contexts.js';
      const contents = `
        const main = require('main-module');
        function loadModule() {
          return require('function-scoped');
        }
        const conditional = condition && require('conditional-module');
        const computed = require(\`template-\${name}\`);
      `;
      
      const result = parse({ filename, contents });
      
      expect(result).toEqual([
        'main-module',
        'function-scoped',
        'conditional-module'
        // Note: template literals with variables should be ignored as they can't be statically analyzed
      ]);
    });

    it('should ignore non-string import/require arguments', () => {
      const filename = 'invalid.ts';
      const contents = `
        import validImport from 'valid-module';
        const variable = 'module-name';
        const dynamicRequire = require(variable);
        const computedRequire = require(getModuleName());
        import('./static-string');
      `;
      
      const result = parse({ filename, contents });
      
      expect(result).toEqual([
        'valid-module',
        './static-string'
      ]);
    });

    it('should handle imports with side effects only', () => {
      const filename = 'side-effects.ts';
      const contents = `
        import 'polyfill';
        import './init-script.js';
        import '../styles/global.css';
        require('side-effect-module');
      `;
      
      const result = parse({ filename, contents });
      
      expect(result).toEqual([
        'polyfill',
        './init-script.js',
        '../styles/global.css',
        'side-effect-module'
      ]);
    });

    it('should handle type-only imports', () => {
      const filename = 'types.ts';
      const contents = `
        import type { User } from './types/User';
        import type { Config } from 'config-lib';
        import { type ApiResponse } from './api';
        import { useState, type Dispatch } from 'react';
      `;
      
      const result = parse({ filename, contents });
      
      expect(result).toEqual([
        './types/User',
        'config-lib',
        './api',
        'react'
      ]);
    });

    it('should return empty array for files with no imports', () => {
      const filename = 'no-imports.ts';
      const contents = `
        const greeting = 'Hello, World!';
        function sayHello() {
          console.log(greeting);
        }
        export { sayHello };
      `;
      
      const result = parse({ filename, contents });
      
      expect(result).toEqual([]);
    });

    it('should handle malformed or commented import statements', () => {
      const filename = 'commented.ts';
      const contents = `
        import validModule from 'valid';
        // import commentedOut from 'commented';
        /* 
         * import blockCommented from 'block-commented';
         */
        // const commented = require('commented-require');
        const valid = require('valid-require');
      `;
      
      const result = parse({ filename, contents });
      
      expect(result).toEqual([
        'valid',
        'valid-require'
      ]);
    });

    it('should handle imports in strings and template literals correctly', () => {
      const filename = 'strings.ts';
      const contents = `
        import realModule from 'real-module';
        const codeString = "import fake from 'fake-module';";
        const templateString = \`const fake = require('template-fake');\`;
        const jsxString = '<import src="not-real" />';
      `;
      
      const result = parse({ filename, contents });
      
      expect(result).toEqual([
        'real-module'
      ]);
    });

    it('should handle export re-exports', () => {
      const filename = 're-exports.ts';
      const contents = `
        export { default } from 'external-lib';
        export * from './internal-module';
        export { namedExport } from '../utils/helpers';
        export type { TypeExport } from './types';
      `;
      
      const result = parse({ filename, contents });
      
      expect(result).toEqual([
        'external-lib',
        './internal-module',
        '../utils/helpers',
        './types'
      ]);
    });
  });
});