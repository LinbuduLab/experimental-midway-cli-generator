import {
  ArrowFunction,
  Project,
  SyntaxKind,
  VariableDeclarationKind,
} from 'ts-morph';
import { addConstExportTypeRef, addConstExportTypeAssertion } from './export';
import { appendStatementAfterImports } from './import';
import { addPluginUse } from './plugin';
import { unshiftStatementInsideClassMethod } from './configuration';
import * as path from 'path';
import * as strip from 'strip-comments';

const project = new Project();

const configSource = project.addSourceFileAtPath(
  path.resolve(__dirname, '../../base/config-origin/config.default.ts')
);

const configurationSource = project.addSourceFileAtPath(
  path.resolve(__dirname, '../../base/midway-configuration-origin.ts')
);

// addConstExportTypeAssertion(configSource, 'x', 'string');

// addPluginUse(configurationSource, 'xx');

// appendStatementAfterImports(configurationSource, 'const x = 1');

// appendStatementsAfterImports(configSource, []);
