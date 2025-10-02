import { promises as fs } from 'fs';
import * as path from 'path';
import type { ScannedFile } from './scanner.js';
import { parse as parseImports } from './import-parser.js';

export interface DependencyGraphNode {
  id: string;
}

export interface DependencyGraphLink {
  source: string;
  target: string;
}

export interface DependencyGraph {
  nodes: DependencyGraphNode[];
  links: DependencyGraphLink[];
}

/**
 * Given an import path, guess possible file paths by changing extensions. TODO:
 * figure out how to get Typescript's own resolution logic to do this.
 * @param importPath - The import path to analyze
 * @returns Array of possible file paths with different extensions
 */
export function guessPossibleExtensions(importPath: string): string[] {
  const extensionMap = new Map([
    ['.js', ['.js', '.ts']],
    ['.jsx', ['.jsx', '.tsx']],
    ['.mjs', ['.mjs', '.mts']],
    ['.cjs', ['.cjs', '.cts']],
  ]);

  const ext = path.extname(importPath);

  if (!ext) {
    const hasTrailingSep = importPath.endsWith(path.sep);

    return hasTrailingSep
      ? [importPath + 'index.ts', importPath + 'index.js']
      : [
          importPath + '.ts',
          importPath + '.js',
          importPath + path.sep + 'index.ts',
          importPath + path.sep + 'index.js',
        ];
  }

  const basename = path.basename(importPath, ext);
  const dir = path.dirname(importPath);
  const prefix = path.isAbsolute(importPath) ? '' : `.${path.sep}`;
  return (
    extensionMap
      .get(ext)
      ?.map(ext => prefix + path.join(dir, basename + ext)) ?? [importPath]
  );
}

/**
 * Parse scanned files and generate a dependency graph data structure
 * @param scannedFiles - Array of scanned files from the scanner module
 * @returns Promise resolving to a dependency graph with nodes and links
 */
export async function parse(
  scannedFiles: ScannedFile[]
): Promise<DependencyGraph> {
  // Create nodes from all scanned files using relative paths as IDs
  const nodes: DependencyGraphNode[] = scannedFiles.map(file => ({
    id: file.relativePath,
  }));

  const foundRelativePaths = new Set(nodes.map(node => node.id));

  // Create a map for quick lookup of relative paths by absolute path
  const absoluteToRelativeMap = new Map<string, string>();
  const relativePathSet = new Set<string>();

  for (const file of scannedFiles) {
    const absolutePath = path.resolve(file.rootDir, file.relativePath);
    absoluteToRelativeMap.set(absolutePath, file.relativePath);
    relativePathSet.add(file.relativePath);
  }

  const links: DependencyGraphLink[] = [];

  // Process each file to find its imports
  for (const file of scannedFiles) {
    const absolutePath = path.resolve(file.rootDir, file.relativePath);
    try {
      const contents = await fs.readFile(absolutePath, 'utf-8');
      const imports = parseImports({
        filename: file.relativePath,
        contents,
        rootDir: file.rootDir,
      });

      // Process each import
      for (const importPath of imports) {
        // Skip external package imports (those that don't start with . or /)
        if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
          continue;
        }

        const possiblePaths = guessPossibleExtensions(importPath);

        for (const possiblePath of possiblePaths) {
          if (foundRelativePaths.has(possiblePath)) {
            links.push({
              source: file.relativePath,
              target: possiblePath,
            });
          }
        }
      }
    } catch (error) {
      // If we can't read the file, skip it silently
      console.warn(`Warning: Could not read file ${absolutePath}:`, error);
    }
  }

  return {
    nodes,
    links,
  };
}
