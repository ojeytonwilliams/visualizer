import * as ts from 'typescript';
import * as path from 'path';

export interface ParseOptions {
  filename: string;
  contents: string;
  rootDir: string;
}

/**
 * Parse a file's contents and extract all import and require statements
 * @param options - Object containing filename and file contents
 * @returns Array of imported/required module paths
 */
export function parse(options: ParseOptions): string[] {
  const { filename, contents, rootDir } = options;
  const imports: string[] = [];

  // Determine script kind based on file extension
  const scriptKind = getScriptKind(filename);

  // Create AST using TypeScript compiler
  const sourceFile = ts.createSourceFile(
    filename,
    contents,
    ts.ScriptTarget.Latest,
    true,
    scriptKind
  );

  // Traverse the AST and collect imports
  function visit(node: ts.Node) {
    // Handle ES6 import statements
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier;
      if (ts.isStringLiteral(moduleSpecifier)) {
        imports.push(
          resolveImportPath(moduleSpecifier.text, filename, rootDir)
        );
      }
    }

    // Handle export...from statements (re-exports)
    else if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
      if (ts.isStringLiteral(node.moduleSpecifier)) {
        imports.push(
          resolveImportPath(node.moduleSpecifier.text, filename, rootDir)
        );
      }
    }

    // Handle dynamic imports: import('module')
    else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword
    ) {
      const arg = node.arguments[0];
      if (arg && ts.isStringLiteral(arg)) {
        imports.push(resolveImportPath(arg.text, filename, rootDir));
      }
    }

    // Handle CommonJS require: require('module')
    else if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'require' &&
      node.arguments.length > 0
    ) {
      const arg = node.arguments[0];
      if (ts.isStringLiteral(arg)) {
        imports.push(resolveImportPath(arg.text, filename, rootDir));
      }
    }

    // Continue traversing child nodes
    ts.forEachChild(node, visit);
  }

  // Start traversal from the root
  visit(sourceFile);

  return imports;
}

function isInsideRoot(parent: string, child: string, rootDir: string): boolean {
  const root = path.resolve(rootDir);
  const absolutePath = path.resolve(root, parent, child);
  const relationship = path.relative(root, absolutePath);

  return !relationship.startsWith('..' + path.sep) && relationship !== '..';
}

/**
 * Resolve an import path relative to the importing file
 * @param importPath - The import path from the source code
 * @param filepath - The path of the importing file
 * @returns The resolved import path
 */
export function resolveImportPath(
  importPath: string,
  filepath: string,
  rootDir: string
): string {
  if (path.isAbsolute(filepath))
    throw Error(
      `The file path "${filepath}" is absolute. All paths must be normalized and start with ./`
    );

  const normalizedFilePath = `.${path.sep}${path.normalize(filepath)}`;

  if (normalizedFilePath !== filepath)
    throw Error(
      `The file path "${filepath}" is not normalized. All paths must be normalized and start with ./`
    );

  if (normalizedFilePath.includes('..'))
    throw Error(
      `The file path "${filepath}" is not fully specified. The file path cannot contain .. segments.`
    );

  // Not a relative import:
  if (!importPath.startsWith('.') && !importPath.startsWith(path.sep)) {
    return importPath;
  }

  const fileDir = path.dirname(filepath);
  const resolved = path.resolve(path.sep, fileDir, importPath);

  // Check if the import goes outside the project root
  if (!isInsideRoot(fileDir, importPath, rootDir)) {
    throw new Error(
      `Relative import "${importPath}" in file "${filepath}" resolves outside the project root.`
    );
  }

  return `.${resolved}`;
}

/**
 * Determine the TypeScript ScriptKind based on file extension
 */
function getScriptKind(filename: string): ts.ScriptKind {
  const ext = filename.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'ts':
      return ts.ScriptKind.TS;
    case 'tsx':
      return ts.ScriptKind.TSX;
    case 'js':
      return ts.ScriptKind.JS;
    case 'jsx':
      return ts.ScriptKind.JSX;
    case 'json':
      return ts.ScriptKind.JSON;
    default:
      return ts.ScriptKind.Unknown;
  }
}
