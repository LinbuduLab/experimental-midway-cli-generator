import { SourceFile } from 'ts-morph';

import {
  ensureLifeCycleMethods,
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
  ensureLifeCycleMethods(source, ['onReady']);
}
