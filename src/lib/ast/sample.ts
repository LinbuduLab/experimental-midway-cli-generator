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
import { addConfigKey, addConfigExport } from './config';
import {
  tmp,
  getExistClassMethods,
  updateDecoratorArrayArgs,
  addLifeCycleMethods,
  getLifeCycleClassMethods,
  addPlainClassMethods,
  addClassProperty,
  addClassPropertyWithMidwayDecorator,
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

getExistClassMethodsDeclaration(configurationSource, 'ContainerConfiguration');

console.log(
  getExistClassMethods(configurationSource, 'ContainerConfiguration')
);
