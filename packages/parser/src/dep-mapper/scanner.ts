import { promises as fs } from 'fs';
import * as path from 'path';

export interface ScannedFile {
  /** The scanned directory */
  rootDir: string;
  /** The relative path from the project root */
  relativePath: string;
  /** The file extension (e.g., '.ts', '.tsx', '.js', '.jsx') */
  extension: string;
  /** The filename with extension */
  name: string;
}

/**
 * Supported source code file extensions
 */
const SUPPORTED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

/**
 * Directories to ignore during scanning
 */
const IGNORED_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  '.vscode',
  'dist',
  'build',
  'coverage',
]);

/**
 * Recursively scans a directory for source code files
 * @param rootDir - The absolute path to the directory to scan
 * @returns Promise resolving to an array of ScannedFile objects
 */
export async function scanDirectory(rootDir: string): Promise<ScannedFile[]> {
  const files: ScannedFile[] = [];

  async function scanRecursively(currentDir: string): Promise<void> {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          // Skip ignored directories
          if (IGNORED_DIRECTORIES.has(entry.name)) {
            continue;
          }

          // Recursively scan subdirectory
          await scanRecursively(fullPath);
        } else if (entry.isFile()) {
          const extension = path.extname(entry.name);

          // Only include supported file extensions
          if (SUPPORTED_EXTENSIONS.has(extension)) {
            const relativePath = path.relative(rootDir, fullPath);

            files.push({
              rootDir,
              relativePath: `.${path.sep}${relativePath}`,
              extension,
              name: entry.name,
            });
          }
        }
      }
    } catch (error) {
      // Re-throw with more context
      throw new Error(
        `Failed to scan directory '${currentDir}': ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Validate that the root directory exists
  try {
    const stats = await fs.stat(rootDir);
    if (!stats.isDirectory()) {
      throw new Error(`Path '${rootDir}' is not a directory`);
    }
  } catch (error) {
    throw new Error(
      `Directory '${rootDir}' does not exist or is not accessible: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  await scanRecursively(rootDir);

  return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}
