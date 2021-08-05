import { CAC } from 'cac';
import path from 'path';
import fs from 'fs-extra';
import { compile as EJSCompile } from 'ejs';

import prettier from 'prettier';
import {
  ensureBooleanType,
  formatTSFile,
  inputPromptStringValue,
} from './lib/helper';
import { names } from './lib/helper';
import findUp from 'find-up';
import consola from 'consola';
import { Project } from 'ts-morph';
import { checkDepExist, installDep } from './lib/package';
import {
  addImportDeclaration,
  ImportType,
  updateDecoratorArrayArgs,
} from './lib/ast';

export const useSwaggerGenerator = (cli: CAC) => {
  cli
    .command('swagger', 'Swagger related', {
      allowUnknownOptions: true,
    })
    .option('--local-only [localOnly]', 'Enable at local only', {
      default: true,
    })
    .option('--dry-run [dryRun]', 'Dry run to see what is happening')
    .action(async options => {
      options.localOnly = ensureBooleanType(options.localOnly);
      if (!checkDepExist('@midwayjs/swagger')) {
        installDep('@midwayjs/swagger');
      }

      const projectDirPath = process.env.GEN_LOCAL
        ? path.resolve(__dirname, '../project')
        : process.cwd();

      const project = new Project();

      const configurationPath = path.resolve(
        projectDirPath,
        './src/configuration.ts'
      );
      const configurationSource =
        project.addSourceFileAtPath(configurationPath);

      addImportDeclaration(
        configurationSource,
        'swagger',
        '@midwayjs/swagger',
        ImportType.NAMESPACE_IMPORT
      );

      updateDecoratorArrayArgs(
        configurationSource,
        'Configuration',
        'imports',
        'swagger'
      );

      formatTSFile(configurationPath);
    });
};
