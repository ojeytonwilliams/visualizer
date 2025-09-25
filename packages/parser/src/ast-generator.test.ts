import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import * as path from 'path';
import { ASTGenerator } from './modules/ast-generator';

// Tests
vi.mock('node:fs');
vi.mock('node:fs/promises');

describe('AST Generator', () => {
  const testDir = path.join(process.cwd(), 'ast-test-fixture');
  let generator: ASTGenerator;

  beforeEach(async () => {
    generator = new ASTGenerator();

    // Create test directory structure
    await fs.mkdir(testDir, { recursive: true });
    
    // Create test TypeScript file
    await fs.writeFile(
      path.join(testDir, 'valid.ts'),
      `import { Component } from 'react';
import * as utils from './utils';
import helpers from '../helpers';

export interface User {
  id: number;
  name: string;
}

export const createUser = (name: string): User => {
  return { id: Date.now(), name };
};

export default class UserManager {
  private users: User[] = [];
  
  addUser(user: User) {
    this.users.push(user);
  }
}`
    );

    // Create test JavaScript file
    await fs.writeFile(
      path.join(testDir, 'valid.js'),
      `const React = require('react');
const { useState } = require('react');
import defaultExport from './module';

function Component() {
  const [state, setState] = useState(0);
  return React.createElement('div', null, state);
}

module.exports = Component;`
    );

    // Create test JSX file
    await fs.writeFile(
      path.join(testDir, 'valid.jsx'),
      `import React from 'react';
import { Button } from './components/Button';

const App = () => {
  return (
    <div>
      <Button onClick={() => console.log('clicked')}>
        Click me
      </Button>
    </div>
  );
};

export default App;`
    );

    // Create test TSX file
    await fs.writeFile(
      path.join(testDir, 'valid.tsx'),
      `import React, { useState } from 'react';
import type { FC } from 'react';

interface Props {
  title: string;
  onClick: () => void;
}

const MyComponent: FC<Props> = ({ title, onClick }) => {
  const [count, setCount] = useState<number>(0);
  
  return (
    <div onClick={onClick}>
      <h1>{title}</h1>
      <p>Count: {count}</p>
    </div>
  );
};

export default MyComponent;`
    );

    // Create file with syntax errors
    await fs.writeFile(
      path.join(testDir, 'invalid.ts'),
      `import { Component from 'react'; // Missing closing brace
import * as utils from ;

export const broken = (: string => {
  return {
    id: Date.now(
    name
  };
`
    );
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('generateASTForFile', () => {
    it('should generate AST for valid TypeScript file', async () => {
      const filePath = path.join(testDir, 'valid.ts');
      const result = await generator.generateASTForFile(filePath);

      expect(result).not.toBeNull();
      expect(result!.filePath).toBe(filePath);
      expect(result!.sourceFile).toBeDefined();
      expect(ts.isSourceFile(result!.sourceFile)).toBe(true);
      expect(result!.sourceFile.fileName).toBe(filePath);
      expect(result!.diagnostics).toBeDefined();
    });

    it('should generate AST for valid JavaScript file', async () => {
      const filePath = path.join(testDir, 'valid.js');
      const result = await generator.generateASTForFile(filePath);

      expect(result).not.toBeNull();
      expect(result!.filePath).toBe(filePath);
      expect(result!.sourceFile).toBeDefined();
      expect(ts.isSourceFile(result!.sourceFile)).toBe(true);
    });

    it('should generate AST for valid JSX file', async () => {
      const filePath = path.join(testDir, 'valid.jsx');
      const result = await generator.generateASTForFile(filePath);

      expect(result).not.toBeNull();
      expect(result!.sourceFile).toBeDefined();
      expect(ts.isSourceFile(result!.sourceFile)).toBe(true);
    });

    it('should generate AST for valid TSX file', async () => {
      const filePath = path.join(testDir, 'valid.tsx');
      const result = await generator.generateASTForFile(filePath);

      expect(result).not.toBeNull();
      expect(result!.sourceFile).toBeDefined();
      expect(ts.isSourceFile(result!.sourceFile)).toBe(true);
    });

    it('should return null for files with errors when includeErrorFiles is false', async () => {
      const filePath = path.join(testDir, 'invalid.ts');
      const result = await generator.generateASTForFile(filePath);

      expect(result).toBeNull();
    });

    it('should return AST node for files with errors when includeErrorFiles is true', async () => {
      const generatorWithErrors = new ASTGenerator({ includeErrorFiles: true });
      const filePath = path.join(testDir, 'invalid.ts');
      const result = await generatorWithErrors.generateASTForFile(filePath);

      expect(result).not.toBeNull();
      expect(result!.diagnostics.length).toBeGreaterThan(0);
    });

    it('should throw error for non-existent file', async () => {
      const filePath = path.join(testDir, 'non-existent.ts');
      
      await expect(generator.generateASTForFile(filePath))
        .rejects.toThrow(/Failed to generate AST/);
    });
  });

  describe('generateASTsForFiles', () => {
    it('should generate ASTs for multiple valid files', async () => {
      const filePaths = [
        path.join(testDir, 'valid.ts'),
        path.join(testDir, 'valid.js'),
        path.join(testDir, 'valid.jsx'),
        path.join(testDir, 'valid.tsx')
      ];

      const results = await generator.generateASTsForFiles(filePaths);

      expect(results).toHaveLength(4);
      results.forEach((result, index) => {
        expect(result.filePath).toBe(filePaths[index]);
        expect(result.sourceFile).toBeDefined();
        expect(ts.isSourceFile(result.sourceFile)).toBe(true);
      });
    });

    it('should skip files with errors when includeErrorFiles is false', async () => {
      const filePaths = [
        path.join(testDir, 'valid.ts'),
        path.join(testDir, 'invalid.ts'),
        path.join(testDir, 'valid.js')
      ];

      const results = await generator.generateASTsForFiles(filePaths);

      expect(results).toHaveLength(2);
      expect(results.map(r => path.basename(r.filePath))).toEqual(['valid.ts', 'valid.js']);
    });

    it('should include files with errors when includeErrorFiles is true', async () => {
      const generatorWithErrors = new ASTGenerator({ includeErrorFiles: true });
      const filePaths = [
        path.join(testDir, 'valid.ts'),
        path.join(testDir, 'invalid.ts'),
        path.join(testDir, 'valid.js')
      ];

      const results = await generatorWithErrors.generateASTsForFiles(filePaths);

      expect(results).toHaveLength(3);
    });

    it('should handle empty file list', async () => {
      const results = await generator.generateASTsForFiles([]);
      expect(results).toHaveLength(0);
    });
  });

  describe('isSupportedFile', () => {
    it('should return true for supported file extensions', () => {
      expect(generator.isSupportedFile('file.ts')).toBe(true);
      expect(generator.isSupportedFile('file.tsx')).toBe(true);
      expect(generator.isSupportedFile('file.js')).toBe(true);
      expect(generator.isSupportedFile('file.jsx')).toBe(true);
    });

    it('should return false for unsupported file extensions', () => {
      expect(generator.isSupportedFile('file.css')).toBe(false);
      expect(generator.isSupportedFile('file.html')).toBe(false);
      expect(generator.isSupportedFile('file.md')).toBe(false);
      expect(generator.isSupportedFile('file.json')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(generator.isSupportedFile('file.TS')).toBe(true);
      expect(generator.isSupportedFile('file.JSX')).toBe(true);
    });
  });

  describe('updateCompilerOptions', () => {
    it('should update compiler options', () => {
      generator.updateCompilerOptions({
        target: ts.ScriptTarget.ES2015,
        strict: true
      });

      // Test that the options were applied by generating an AST
      // The updated options should be used internally
      expect(() => generator.updateCompilerOptions({ target: ts.ScriptTarget.ES2015 }))
        .not.toThrow();
    });
  });

  describe('constructor configuration', () => {
    it('should use custom compiler options', () => {
      const customGenerator = new ASTGenerator({
        compilerOptions: {
          target: ts.ScriptTarget.ES5,
          strict: true
        },
        includeErrorFiles: true
      });

      expect(customGenerator).toBeDefined();
      expect(customGenerator.isSupportedFile('test.ts')).toBe(true);
    });

    it('should use default configuration when no options provided', () => {
      const defaultGenerator = new ASTGenerator();
      
      expect(defaultGenerator).toBeDefined();
      expect(defaultGenerator.isSupportedFile('test.ts')).toBe(true);
    });
  });
});
