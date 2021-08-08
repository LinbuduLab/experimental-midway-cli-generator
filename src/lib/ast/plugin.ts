import { SourceFile } from 'ts-morph';
import { getExistClassMethodsDeclaration } from './class';
import {
  getLifeCycleClass,
  getLifeCycleClassMethods,
  ensureLifeCycleMethods,
  ensureLifeCycleClassPropertyWithMidwayDecorator,
  getLifeCycleClassMethodDeclaration,
} from './configuration';
import { LIFE_CYCLE_CLASS_IDENTIFIER } from './utils';

export function insertFunctionBodyStatement(
  source: SourceFile,
  functionIdentifier: string,
  statements: string[],
  apply = true
) {
  const method = getExistClassMethodsDeclaration(
    source,
    LIFE_CYCLE_CLASS_IDENTIFIER,
    functionIdentifier
  );

  method.addStatements(statements);
}

// add to onReady
// this.app.use
export function addPluginUse(
  source: SourceFile,
  pluginIdentifier: string,
  apply = true
) {
  ensureLifeCycleMethods(source, ['onReady'], false);
  ensureLifeCycleClassPropertyWithMidwayDecorator(source, 'app', 'App', false);

  const onReadyMethod = getLifeCycleClassMethodDeclaration(source, 'onReady');

  // TODO: support specify insert position
  onReadyMethod.insertStatements(
    0,
    `this.app.use(await this.app.generateMiddleware("${pluginIdentifier}"))`
  );

  apply && source.saveSync();
}
