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

const AXIOS_PKG = '@midwayjs/axios';

export const useAxiosGenerator = (cli: CAC) => {
  cli
    .command('axios', 'Axioxs related', {
      allowUnknownOptions: true,
    })
    .option('--dry-run [dryRun]', 'Dry run to see what is happening')
    .action(async options => {
      try {
        if (options.dryRun) {
          consola.success('Executing in `dry run` mode, nothing will happen.');
        }

        const projectDirPath = process.env.GEN_LOCAL
          ? path.resolve(__dirname, '../project')
          : process.cwd();

        consola.info(`Project location: ${chalk.green(projectDirPath)}`);

        options.dryRun
          ? consola.info('`[DryRun]` Skip dependencies installation check.')
          : await ensureDepsInstalled(AXIOS_PKG, projectDirPath);

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
            'axios',
            '@midwayjs/axios',
            ImportType.NAMESPACE_IMPORT
          );

          updateDecoratorArrayArgs(
            configurationSource,
            'Configuration',
            'imports',
            'axios'
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
