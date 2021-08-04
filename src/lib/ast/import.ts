import {
  ArrowFunction,
  ImportDeclaration,
  Project,
  SourceFile,
  SyntaxKind,
  VariableDeclarationKind,
} from 'ts-morph';
import path from 'path';
import consola from 'consola';
import strip from 'strip-comments';

export enum ImportType {
  NAMESPACE_IMPORT = 'NAMESPACE_IMPORT',
  NAMED_IMPORTS = 'NAMED_IMPORTS',
  DEFAULT_IMPORT = 'DEFAULT_IMPORT',
}

export function addImportDeclaration(
  source: SourceFile,
  namespace: string,
  moduleSpecifier: string,
  importType: ImportType.NAMESPACE_IMPORT,
  apply?: boolean
): void;

export function addImportDeclaration(
  source: SourceFile,
  imports: string[],
  moduleSpecifier: string,
  importType: ImportType.NAMED_IMPORTS,
  apply?: boolean
): void;

export function addImportDeclaration(
  source: SourceFile,
  defaultImport: string,
  moduleSpecifier: string,
  importType: ImportType.DEFAULT_IMPORT,
  apply?: boolean
): void;

// 新增一条导入语句
// 如果要新增具名导入成员，使用addNamedImportsMember
// 推荐在新增前使用findImportsSpecifier检查导入是否已存在
export function addImportDeclaration(
  source: SourceFile,
  imports: string | string[],
  moduleSpecifier: string,
  importType: ImportType,
  apply?: boolean
) {
  switch (importType) {
    case ImportType.DEFAULT_IMPORT:
      source.addImportDeclaration({
        defaultImport: imports as string,
        moduleSpecifier,
      });

      break;

    case ImportType.NAMED_IMPORTS:
      source.addImportDeclaration({
        namedImports: imports as string[],
        moduleSpecifier,
      });

      break;

    case ImportType.NAMESPACE_IMPORT:
      source.addImportDeclaration({
        namespaceImport: imports as string,
        moduleSpecifier: moduleSpecifier,
      });

      break;

    default:
      consola.error(`Invalid Import Type ${importType}`);
      process.exit(0);
  }

  const shouldApplySave = apply ?? true;

  shouldApplySave ? source.saveSync() : void 0;
}

// 获得导入声明
export function findImportsDeclaration(
  source: SourceFile
): ImportDeclaration[] {
  const importDeclarations = source
    .getFirstChildByKind(SyntaxKind.SyntaxList)
    .getChildrenOfKind(SyntaxKind.ImportDeclaration);

  return importDeclarations;
}

// 获得导入声明的来源
export function findImportsSpecifier(source: SourceFile): string[] {
  const importDeclarations = findImportsDeclaration(source);

  const specifiers = importDeclarations
    .map(imp => imp.getFirstChildByKind(SyntaxKind.StringLiteral))
    .map(l => l.getText());

  return specifiers;
}

export function addNamedImportsMember(
  source: SourceFile,
  importSpec: string,
  members: string[]
): void {
  const importDec = source

    .getFirstChildByKind(SyntaxKind.SyntaxList)
    .getChildrenOfKind(SyntaxKind.ImportDeclaration)
    .filter(importDec => {
      const importString = importDec
        .getFirstChildByKind(SyntaxKind.StringLiteral)
        .getText();
      return `'${importSpec}'` === importString;
    })[0];

  if (!importDec) {
    source.addImportDeclaration({
      moduleSpecifier: importSpec,
      namedImports: members,
    });
    source.saveSync();

    return;
  }

  const importClause = importDec.getImportClause();
  const namedImports = importClause.getNamedImports().map(x => x.getText());

  const namedImportsCanBeAdded = members.filter(
    mem => !namedImports.includes(mem)
  );

  if (!namedImportsCanBeAdded.length) {
    return;
  }

  importDec.addNamedImports(namedImportsCanBeAdded);

  source.saveSync();
}
