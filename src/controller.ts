import { CAC } from 'cac';
import path from 'path';
import fs from 'fs-extra';
import { compile as EJSCompile } from 'ejs';

import prettier from 'prettier';
import { inputPromptStringValue } from './lib/helper';
import { names } from './lib/helper';
import consola from 'consola';
import chalk from 'chalk';
import findUp from 'find-up';

const DEFAULT_CONTROLLER_DIR_PATH = 'controller';

const getControllerGenPath = (userDir?: string) => {
  const nearestProjectDir = path.dirname(
    findUp.sync(['package.json'], {
      type: 'file',
    })
  );

  const controllerPath = process.env.MW_GEN_LOCAL
    ? path.resolve(__dirname, '../project/src/controller')
    : path.resolve(
        nearestProjectDir,
        'src',
        userDir ? userDir : DEFAULT_CONTROLLER_DIR_PATH
      );

  // fs.ensureDirSync(controllerPath);

  if (process.env.MW_GEN_LOCAL) {
    consola.info('Using local project:');
    consola.info(controllerPath);
  }

  return controllerPath;
};

export const useControllerGenerator = (cli: CAC) => {
  cli
    .command('controller [name]', 'Generate controller', {
      allowUnknownOptions: true,
    })
    .alias('c')
    // generate minimal template file
    .option('--light [light]', 'Generate light template')
    .option('--no-light', 'Opposite of --light')
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
      try {
        if (options.dryRun) {
          consola.success('Executing in `dry run` mode, nothing will happen.');
        }
        if (!name) {
          consola.warn('Controller name cannot be empty!');
          name = await inputPromptStringValue('controller name');
        }

        // e.g. user
        const controllerNames = names(name);
        const fileNameNames = names(options.fileName ?? name);

        // e.g. user.controller
        const fileName = options.dotName
          ? `${fileNameNames.fileName}.controller`
          : fileNameNames.fileName;

        // FIXME: validate
        const generatedPath = path.resolve(
          getControllerGenPath(options.dir),
          `${fileName}.ts`
        );

        consola.info(
          `Controller will be created in ${chalk.green(generatedPath)}`
        );

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
          path.join(
            __dirname,
            `./templates/controller/${
              options.light ? 'controller.ts.ejs' : 'controller-full.ts.ejs'
            }`
          ),
          { encoding: 'utf8' }
        );

        const template = EJSCompile(
          tmp,
          {}
        )({ name: controllerNames.className });

        const outputContent = prettier.format(template, {
          parser: 'typescript',
        });

        if (!options.dryRun) {
          fs.ensureFileSync(generatedPath);
          fs.writeFileSync(generatedPath, outputContent);
        } else {
          consola.success('Controller generator invoked with:');
          consola.info(`name: ${chalk.cyan(name)}`);
          consola.info(`light: ${chalk.cyan(options.light)}`);
          consola.info(`dot name: ${chalk.cyan(options.dotName)}`);
          consola.info(`override: ${chalk.cyan(options.override)}`);
          consola.info(`file name: ${chalk.cyan(fileNameNames.fileName)}`);
          consola.info(`dir: ${chalk.cyan(options.dir)}`);

          consola.info(`File will be created: ${chalk.green(generatedPath)}`);
        }
        consola.success('Generator execution accomplished.');
      } catch (error) {
        consola.fatal('Generator execution failed. \n');
        throw error;
      }
    });
};
