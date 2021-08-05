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
import chalk from 'chalk';
import { checkDepExist, ensureDepsInstalled, installDep } from './lib/package';
import {
  addImportDeclaration,
  ImportType,
  updateDecoratorArrayArgs,
} from './lib/ast';

const SWAGGER_PKG = '@midwayjs/swagger';

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
      try {
        if (options.dryRun) {
          consola.success('Executing in `dry run` mode, nothing will happen.');
        }

        options.localOnly = ensureBooleanType(options.localOnly);

        const projectDirPath = process.env.GEN_LOCAL
          ? path.resolve(__dirname, '../project')
          : process.cwd();

        consola.info(`Project location: ${chalk.green(projectDirPath)}`);

        options.dryRun
          ? consola.info('`[DryRun]` Skip dependencies installation check.')
          : await ensureDepsInstalled(SWAGGER_PKG, projectDirPath);

        if (!options.dryRun) {
          consola.info('Source code will be transformed.');
          const project = new Project();

          const configurationPath = path.resolve(
            projectDirPath,
            './src/configuration.ts'
          );

          if (!fs.existsSync(configurationPath)) {
            consola.error(
              `Cannot find ${chalk.cyan('configuration.ts')} in ${chalk.green(
                configurationPath
              )}`
            );
            process.exit(0);
          }

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
        } else {
          consola.info('`[DryRun]` Source code will be transformed.');
        }

        consola.success('Generator execution accomplished.');
      } catch (error) {
        consola.fatal('Generator execution failed. \n');
        throw error;
      }
    });
};
