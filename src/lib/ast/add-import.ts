import {
  ArrowFunction,
  Project,
  SyntaxKind,
  VariableDeclarationKind,
} from 'ts-morph';
import * as path from 'path';
import * as strip from 'strip-comments';

export enum ImportType {
  NAMESPACE_IMPORT,
  NAMED_IMPORTS,
  DEFAULT_IMPORT,
}

export function addImportDeclaration(
  filePath: string,
  namespace: string,
  moduleSpecifier: string,
  importType: ImportType.NAMESPACE_IMPORT
): void;

export function addImportDeclaration(
  filePath: string,
  imports: string[],
  moduleSpecifier: string,
  importType: ImportType.NAMED_IMPORTS
): void;

export function addImportDeclaration(
  filePath: string,
  defaultImport: string,
  moduleSpecifier: string,
  importType: ImportType.DEFAULT_IMPORT
): void;

export function addImportDeclaration(
  filePath: string,
  imports: string | string[],
  moduleSpecifier: string,
  importType: ImportType
) {
  const project = new Project();

  const source = project.addSourceFileAtPath(
    path.isAbsolute(filePath) ? filePath : path.resolve(__dirname, filePath)
  );

  console.log(
    'path.isAbsolute(filePath) ? filePath : path.resolve(__dirname, filePath): ',
    path.isAbsolute(filePath) ? filePath : path.resolve(__dirname, filePath)
  );

  if (importType === ImportType.DEFAULT_IMPORT) {
    source.addImportDeclaration({
      defaultImport: imports as string,
      moduleSpecifier,
    });
  }

  if (importType === ImportType.NAMED_IMPORTS) {
    source.addImportDeclaration({
      namedImports: imports as string[],
      moduleSpecifier,
    });
  }

  if (importType === ImportType.NAMESPACE_IMPORT) {
    source.addImportDeclaration({
      namespaceImport: imports as string,
      moduleSpecifier: moduleSpecifier,
    });
  }

  source.saveSync();
}
