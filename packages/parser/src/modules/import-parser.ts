import * as ts from 'typescript';

export interface ParseOptions {
  filename: string;
  contents: string;
}

/**
 * Parse a file's contents and extract all import and require statements
 * @param options - Object containing filename and file contents
 * @returns Array of imported/required module paths
 */
export function parse(options: ParseOptions): string[] {
  const { filename, contents } = options;
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
        imports.push(moduleSpecifier.text);
      }
    }
    
    // Handle export...from statements (re-exports)
    else if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
      if (ts.isStringLiteral(node.moduleSpecifier)) {
        imports.push(node.moduleSpecifier.text);
      }
    }
    
    // Handle dynamic imports: import('module')
    else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const arg = node.arguments[0];
      if (arg && ts.isStringLiteral(arg)) {
        imports.push(arg.text);
      }
    }
    
    // Handle CommonJS require: require('module')
    else if (ts.isCallExpression(node) && 
             ts.isIdentifier(node.expression) && 
             node.expression.text === 'require' &&
             node.arguments.length > 0) {
      const arg = node.arguments[0];
      if (ts.isStringLiteral(arg)) {
        imports.push(arg.text);
      }
    }

    // Continue traversing child nodes
    ts.forEachChild(node, visit);
  }

  // Start traversal from the root
  visit(sourceFile);

  return imports;
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
