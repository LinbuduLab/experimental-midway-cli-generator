import { SourceFile } from 'ts-morph';
import { getExistClassMethodsDeclaration } from './class';
import { ensureLifeCycleMethods } from './configuration';

export function insertFunctionBodyStatement(
  source: SourceFile,
  functionIdentifier: string,
  statements: string[],
  apply = true
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
