import { CAC } from 'cac';
import path from 'path';
import fs from 'fs-extra';
import { formatTSFile } from './lib/helper';

import consola from 'consola';
import { Project } from 'ts-morph';
import chalk from 'chalk';
import { ensureDepsInstalled, ensureDevDepsInstalled } from './lib/package';
import {
  addConstExport,
  addImportDeclaration,
  ImportType,
  updateDecoratorArrayArgs,
} from './lib/ast';

const OSS_DEP = ['@midwayjs/oss'];
const OSS_DEV_DEP = ['@types/ali-oss'];

export const useOSSGenerator = (cli: CAC) => {
  cli
    .command('oss', 'OSS related', {
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
          : await ensureDepsInstalled(OSS_DEP, projectDirPath);

        options.dryRun
          ? consola.info('`[DryRun]` Skip devDependencies installation check.')
          : await ensureDevDepsInstalled(OSS_DEV_DEP, projectDirPath);

        if (!options.dryRun) {
          consola.info('Source code will be transformed.');
          const project = new Project();

          const configPath = path.resolve(
            projectDirPath,
            './src/config/config.default.ts'
          );

          if (!fs.existsSync(configPath)) {
            consola.error(
              `Cannot find ${chalk.cyan('config.default.ts')} in ${chalk.green(
                configPath
              )}`
            );
            process.exit(0);
          }

          const configSource = project.addSourceFileAtPath(configPath);

          addConstExport(configSource, 'oss', {
            client: {
              accessKeyId: 'your access key',
              accessKeySecret: 'your access secret',
              bucket: 'your bucket name',
              endpoint: 'oss-cn-hongkong.aliyuncs.com',
              timeout: '60s',
            },
          });

          formatTSFile(configPath);

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
            'oss',
            '@midwayjs/oss',
            ImportType.NAMESPACE_IMPORT
          );

          updateDecoratorArrayArgs(
            configurationSource,
            'Configuration',
            'imports',
            'oss'
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
