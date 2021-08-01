import { CAC } from 'cac';
import path from 'path';
import fs from 'fs-extra';
import { compile as EJSCompile } from 'ejs';

import prettier from 'prettier';
import { ensureBooleanType, inputPromptStringValue } from './lib/helper';
import { names } from './lib/helper';
import findUp from 'find-up';
import consola from 'consola';
import chalk from 'chalk';

const DEFAULT_SERVICE_DIR_PATH = 'service';

const getServiceGenPath = (userDir?: string) => {
  const nearestProjectDir = path.dirname(
    findUp.sync(['package.json'], {
      type: 'file',
    })
  );

  const servicePath = process.env.MW_GEN_LOCAL
    ? path.resolve(__dirname, '../project/src/service')
    : path.resolve(
        nearestProjectDir,
        'src',
        userDir ? userDir : DEFAULT_SERVICE_DIR_PATH
      );

  // fs.ensureDirSync(servicePath);

  if (process.env.MW_GEN_LOCAL) {
    consola.info('Using local project:');
    consola.info(servicePath);
  }

  return servicePath;
};

export const useServiceGenerator = (cli: CAC) => {
  cli
    .command('service [name]', 'Generate service', {
      allowUnknownOptions: true,
    })
    .alias('s')
    // use dot name like app.controller.ts
    .option('--dot-name [dotName]', 'Use dot file name')
    .option('--no-dot-name', 'Opposite of --dot-name')
    .option(
      '--override [override]',
      'Override on file with same target name existing'
    )
    .option('--no-override', 'Opposite of --override')
    .option('--file-name [fileName]', 'File name for generated')
    .option('--dir [dir]', 'Dir name for generated')
    .option('--dry-run [dryRun]', 'Dry run to see what is happening', {
      default: false,
    })
    .action(async (name, options) => {
      if (options.dryRun) {
        consola.success('Executing in `dry run` mode, nothing will happen.');
      }

      if (!name) {
        consola.warn('Service name cannot be empty!');
        name = await inputPromptStringValue('service name', 'tmp');
      }

      const serviceNames = names(name);
      const fileNameNames = names(options.fileName ?? name);

      console.log('options: ', options);

      const fileName = options.dotName
        ? `${fileNameNames.fileName}.service`
        : fileNameNames.fileName;

      const generatedPath = path.resolve(
        getServiceGenPath(options.dir),
        `${fileName}.ts`
      );

      consola.info(`Service will be created in ${chalk.green(generatedPath)}`);

      const exist = fs.existsSync(generatedPath);

      if (exist && !options.override) {
        consola.error(
          'File exist, enable `--override` to override existing file.'
        );
        process.exit(0);
      } else if (exist) {
        consola.warn('overriding exist file');
      }

      const tmp = fs.readFileSync(
        path.join(__dirname, `./templates/service/${'service.ts.ejs'}`),
        { encoding: 'utf8' }
      );

      const template = EJSCompile(tmp, {})({ name: serviceNames.className });

      const outputContent = prettier.format(template, { parser: 'typescript' });

      if (!options.dryRun) {
        fs.ensureFileSync(generatedPath);
        fs.writeFileSync(generatedPath, outputContent);
      } else {
        consola.success('Service generator invoked with:');
        consola.info(`name: ${chalk.cyan(name)}`);
        consola.info(`dot name: ${chalk.cyan(options.dotName)}`);
        consola.info(`override: ${chalk.cyan(options.override)}`);
        consola.info(`file name: ${chalk.cyan(fileNameNames.fileName)}`);
        consola.info(`dir: ${chalk.cyan(options.dir)}`);
      }
    });
};
