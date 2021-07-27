import {
  ArrowFunction,
  Project,
  SourceFile,
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
  source: SourceFile,
  namespace: string,
  moduleSpecifier: string,
  importType: ImportType.NAMESPACE_IMPORT
): void;

export function addImportDeclaration(
  source: SourceFile,
  imports: string[],
  moduleSpecifier: string,
  importType: ImportType.NAMED_IMPORTS
): void;

export function addImportDeclaration(
  source: SourceFile,
  defaultImport: string,
  moduleSpecifier: string,
  importType: ImportType.DEFAULT_IMPORT
): void;

export function addImportDeclaration(
  source: SourceFile,
  imports: string | string[],
  moduleSpecifier: string,
  importType: ImportType
) {
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
