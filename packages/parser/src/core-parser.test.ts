import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import * as path from 'path';
import { CoreParser } from './modules/core-parser';

// Tests
vi.mock('node:fs');
vi.mock('node:fs/promises');

describe('Core Parser', () => {
  const testDir = path.join(process.cwd(), 'parser-test-fixture');
  let parser: CoreParser;

  beforeEach(async () => {
    parser = new CoreParser();

    // Create test directory structure
    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(path.join(testDir, 'src'), { recursive: true });
    await fs.mkdir(path.join(testDir, 'src', 'components'), { recursive: true });
    await fs.mkdir(path.join(testDir, 'src', 'utils'), { recursive: true });

    // Create test files with various import patterns
    await fs.writeFile(
      path.join(testDir, 'src', 'index.ts'),
      `import React from 'react';
import { useState, useEffect } from 'react';
import * as utils from './utils/helpers';
import Component from './components/Button';
import './styles.css';

const App = () => {
  return <div>Hello World</div>;
};

export default App;`
    );

    await fs.writeFile(
      path.join(testDir, 'src', 'components', 'Button.tsx'),
      `import React, { FC } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../utils/classnames';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

const Button: FC<Props> = ({ variant = 'primary', className, ...props }) => {
  return <button className={cn('btn', variant, className)} {...props} />;
};

export default Button;`
    );

    await fs.writeFile(
      path.join(testDir, 'src', 'utils', 'helpers.js'),
      `const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

// Dynamic import example
const loadModule = async (moduleName) => {
  const module = await import(moduleName);
  return module.default;
};

module.exports = {
  readFile: promisify(fs.readFile),
  loadModule
};`
    );

    await fs.writeFile(
      path.join(testDir, 'src', 'utils', 'classnames.ts'),
      `export const cn = (...classes: (string | undefined)[]): string => {
  return classes.filter(Boolean).join(' ');
};`
    );

    // Create file with mixed import styles
    await fs.writeFile(
      path.join(testDir, 'src', 'mixed.js'),
      `import defaultExport from 'module1';
import { named1, named2 } from 'module2';
import * as namespace from 'module3';
const commonjsModule = require('commonjs-module');
const { destructured } = require('another-module');

// Dynamic imports
async function loadSomething() {
  const dynamic1 = await import('dynamic-module1');
  const dynamic2 = await import('dynamic-module2');
  return { dynamic1, dynamic2 };
}`
    );

    // Create file with syntax errors
    await fs.writeFile(
      path.join(testDir, 'src', 'broken.ts'),
      `import { Component from 'react'; // Missing closing brace
import * as utils from ;

export const broken = (): string => {
  return "This file has syntax errors";
`
    );
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('parseProject', () => {
    it('should parse project and return files, dependencies, and errors', async () => {
      const result = await parser.parseProject(testDir);

      expect(result.files).toBeDefined();
      expect(result.dependencies).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.files)).toBe(true);
      expect(Array.isArray(result.dependencies)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should find all source files in the project', async () => {
      const result = await parser.parseProject(testDir);

      expect(result.files.length).toBeGreaterThan(0);
      const fileNames = result.files.map(f => path.basename(f.relativePath));
      expect(fileNames).toContain('index.ts');
      expect(fileNames).toContain('Button.tsx');
      expect(fileNames).toContain('helpers.js');
      expect(fileNames).toContain('classnames.ts');
      expect(fileNames).toContain('mixed.js');
    });

    it('should extract dependencies from TypeScript files', async () => {
      const result = await parser.parseProject(testDir);
      
      const indexDeps = result.dependencies.filter(d => d.importer.includes('index.ts'));
      expect(indexDeps.length).toBeGreaterThan(0);
      
      const reactDep = indexDeps.find(d => d.importSpecifier === 'react');
      expect(reactDep).toBeDefined();
      expect(reactDep!.importType).toBe('import');
      expect(reactDep!.isDefaultImport).toBe(true);
    });

    it('should extract named imports correctly', async () => {
      const result = await parser.parseProject(testDir);
      
      const indexDeps = result.dependencies.filter(d => d.importer.includes('index.ts'));
      const namedImportDep = indexDeps.find(d => d.importSpecifier === 'react' && d.namedImports);
      
      expect(namedImportDep).toBeDefined();
      expect(namedImportDep!.namedImports).toContain('useState');
      expect(namedImportDep!.namedImports).toContain('useEffect');
    });

    it('should extract dependencies from JavaScript files', async () => {
      const result = await parser.parseProject(testDir);
      
      const helpersDeps = result.dependencies.filter(d => d.importer.includes('helpers.js'));
      expect(helpersDeps.length).toBeGreaterThan(0);
      
      const fsDep = helpersDeps.find(d => d.importSpecifier === 'fs');
      expect(fsDep).toBeDefined();
      expect(fsDep!.importType).toBe('require');
    });

    it('should extract dynamic imports', async () => {
      const result = await parser.parseProject(testDir);
      
      const helpersDeps = result.dependencies.filter(d => d.importer.includes('helpers.js'));
      const dynamicImports = helpersDeps.filter(d => d.importType === 'dynamic-import');
      
      expect(dynamicImports.length).toBeGreaterThan(0);
    });

    it('should handle mixed import styles in single file', async () => {
      const result = await parser.parseProject(testDir);
      
      const mixedDeps = result.dependencies.filter(d => d.importer.includes('mixed.js'));
      
      // Should have ES6 imports
      const esImports = mixedDeps.filter(d => d.importType === 'import');
      expect(esImports.length).toBeGreaterThan(0);
      
      // Should have CommonJS requires
      const requires = mixedDeps.filter(d => d.importType === 'require');
      expect(requires.length).toBeGreaterThan(0);
      
      // Should have dynamic imports
      const dynamicImports = mixedDeps.filter(d => d.importType === 'dynamic-import');
      expect(dynamicImports.length).toBeGreaterThan(0);
    });

    it('should record line numbers for imports', async () => {
      const result = await parser.parseProject(testDir);
      
      const deps = result.dependencies.filter(d => d.importer.includes('index.ts'));
      deps.forEach(dep => {
        expect(dep.lineNumber).toBeGreaterThan(0);
        expect(typeof dep.lineNumber).toBe('number');
      });
    });

    it('should handle files with syntax errors gracefully', async () => {
      const result = await parser.parseProject(testDir);
      
      // Should have some errors recorded
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Should still process other files
      expect(result.files.length).toBeGreaterThan(1);
      expect(result.dependencies.length).toBeGreaterThan(0);
    });

    it('should handle relative path imports', async () => {
      const result = await parser.parseProject(testDir);
      
      const indexDeps = result.dependencies.filter(d => d.importer.includes('index.ts'));
      const relativeDeps = indexDeps.filter(d => d.importSpecifier.startsWith('./'));
      
      expect(relativeDeps.length).toBeGreaterThan(0);
      expect(relativeDeps.some(d => d.importSpecifier === './utils/helpers')).toBe(true);
      expect(relativeDeps.some(d => d.importSpecifier === './components/Button')).toBe(true);
    });

    it('should handle namespace imports', async () => {
      const result = await parser.parseProject(testDir);
      
      const mixedDeps = result.dependencies.filter(d => d.importer.includes('mixed.js'));
      const namespaceDep = mixedDeps.find(d => d.importSpecifier === 'module3');
      
      expect(namespaceDep).toBeDefined();
    });

    it('should throw error for non-existent project directory', async () => {
      const nonExistentDir = path.join(process.cwd(), 'non-existent-project');
      
      await expect(parser.parseProject(nonExistentDir))
        .rejects.toThrow(/Failed to parse project/);
    });

    it('should handle empty project directory', async () => {
      const emptyDir = path.join(process.cwd(), 'empty-project');
      await fs.mkdir(emptyDir, { recursive: true });

      const result = await parser.parseProject(emptyDir);

      expect(result.files).toHaveLength(0);
      expect(result.dependencies).toHaveLength(0);
      expect(result.errors).toHaveLength(0);

      await fs.rm(emptyDir, { recursive: true });
    });
  });
});
