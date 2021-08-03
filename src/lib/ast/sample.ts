import {
  ArrowFunction,
  Project,
  SyntaxKind,
  VariableDeclarationKind,
} from 'ts-morph';
import * as path from 'path';
import * as strip from 'strip-comments';

import { addImportDeclaration, ImportType } from './add-import';
import { addConfigKey } from './config';
import {
  tmp,
  getExistClassMethods,
  updateDecoratorArrayArgs,
  addNamedImports,
  addLifeCycleMethods,
  getLifeCycleClassMethods,
  addPlainClassMethods,
  addClassProperty,
  addClassPropertyWithMidwayDecorator,
} from './configuration';
import { insertFunctionBodyStatement } from './plugin';

const project = new Project();

const configSource = project.addSourceFileAtPath(
  path.resolve(__dirname, '../../base/config-origin/config.default.ts')
);

const configurationSource = project.addSourceFileAtPath(
  path.resolve(__dirname, '../../base/midway-configuration.ts')
);

insertFunctionBodyStatement(configurationSource, 'onReady', []);

// addClassProperty(
//   configurationSource,
//   'ContainerConfiguration',
//   'someProp',
//   ['Inject'],
//   'IMidwayKoaApplication'
// );

// getExistClassMethods(configurationSource);

// updateDecoratorArrayArgs(
//   configurationSource,
//   'Configuration',
//   'imports',
//   'orm'
// );

// addNamedImports(configurationSource, '@midwayjs/decorator', ['App', 'Inject']);
// addLifeCycleMethods(configurationSource, ['onStop']);

// addConfigKey(configSource, 'd', 'xxx');

// tmp(configurationSource);

// 拿到默认导出 √
// 拿到箭头函数 √
// 拿到箭头函数内部进行分析 √
// 新增 config.orm = {} √
// 修改configuration
// 新增import * as orm from "@midwayjs/orm"
// 查看package.json是否存在 不存在则代替安装
// 新增connection相关代码
