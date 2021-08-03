import {
  ArrowFunction,
  Project,
  SourceFile,
  SyntaxKind,
  VariableDeclarationKind,
  DecoratorStructure,
  ClassDeclaration,
  StructureKind,
} from 'ts-morph';
import path from 'path';
import fs from 'fs-extra';
import strip from 'strip-comments';
import {
  addLifeCycleMethods,
  getExistClassMethodsDeclaration,
} from './configuration';

export function insertFunctionBodyStatement(
  source: SourceFile,
  functionIdentifier: string,
  statements: string[]
) {
  const method = getExistClassMethodsDeclaration(
    source,
    'ContainerConfiguration',
    functionIdentifier
  );

  method.addStatements(statements);
}

// add to onReady
export function addPluginUse(source: SourceFile, pluginIdentifier: string) {
  // FIXME: ensure
  addLifeCycleMethods(source, ['onReady']);
}
