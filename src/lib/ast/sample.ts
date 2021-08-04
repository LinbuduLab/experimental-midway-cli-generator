import {
  ArrowFunction,
  Project,
  SyntaxKind,
  VariableDeclarationKind,
} from 'ts-morph';
import { addConstExportTypeRef } from './export';
import * as path from 'path';
import * as strip from 'strip-comments';

const project = new Project();

const configSource = project.addSourceFileAtPath(
  path.resolve(__dirname, '../../base/config-origin/config.default.ts')
);

// const configurationSource = project.addSourceFileAtPath(
//   path.resolve(__dirname, '../../base/midway-configuration.ts')
// );

// addConstExportTypeRef(configSource, 'x', 'string');
