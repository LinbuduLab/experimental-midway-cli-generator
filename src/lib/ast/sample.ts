import {
  ArrowFunction,
  Project,
  SyntaxKind,
  VariableDeclarationKind,
} from 'ts-morph';
import * as path from 'path';
import * as strip from 'strip-comments';

import {
  addImportDeclaration,
  ImportType,
  findImportsDeclaration,
  findImportsSpecifier,
  updateDefaultImportClause,
  updateNamespaceImportClause,
  removeImportDeclaration,
  removeImportDeclarationByTypes,
} from './import';
import {
  addConfigKey,
  addConfigExport,
  updateConfigExportIdentifier,
} from './config';
import {
  getExistClassMethods,
  updateDecoratorArrayArgs,
  ensureLifeCycleMethods,
  getLifeCycleClassMethods,
  addPlainClassMethods,
  ensureClassProperty,
  ensureClassPropertyWithMidwayDecorator,
  ensureLifeCycleMethodArguments,
  getExistClassMethodsDeclaration,
} from './configuration';
import { insertFunctionBodyStatement } from './plugin';

const project = new Project();

const configSource = project.addSourceFileAtPath(
  path.resolve(__dirname, '../../base/config-origin/config.default.ts')
);

const configurationSource = project.addSourceFileAtPath(
  path.resolve(__dirname, '../../base/midway-configuration.ts')
);

updateConfigExportIdentifier(configSource, 'x', 'orm1');

// getExistClassMethodsDeclaration(configurationSource, 'ContainerConfiguration');

// console.log(
//   getExistClassMethods(configurationSource, 'ContainerConfiguration')
// );
// updateDecoratorArrayArgs(configurationSource, 'Configuration', 'imports', 'x');

// ensureLifeCycleMethodArguments(configurationSource, ['onReady', 'onStop']);

// ensureClassPropertyWithMidwayDecorator(configurationSource, 'app', 'App');
