import {
  ArrowFunction,
  Project,
  SyntaxKind,
  VariableDeclarationKind,
} from 'ts-morph';
import * as path from 'path';
import * as strip from 'strip-comments';

import { addImportDeclaration, ImportType } from './add-import';
import { addConfigKey } from './set-config-key';
import {
  tmp,
  getExistClassMethods,
  updateDecoratorArrayArgs,
} from './configuration';

const project = new Project();

const configSource = project.addSourceFileAtPath(
  path.resolve(__dirname, '../../base/config-origin/config.default.ts')
);

const configurationSource = project.addSourceFileAtPath(
  path.resolve(__dirname, '../../base/midway-configuration.ts')
);

// getExistClassMethods(configurationSource);

updateDecoratorArrayArgs(
  configurationSource,
  'Configuration',
  'imports',
  'orm'
);

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
