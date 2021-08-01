import { CAC } from 'cac';
import path from 'path';
import fs from 'fs-extra';
import { compile as EJSCompile } from 'ejs';

import prettier from 'prettier';
import { inputPromptStringValue } from './lib/helper';
import { names } from './lib/helper';
import findUp from 'find-up';
import consola from 'consola';
import chalk from 'chalk';

const DEFAULT_MIDDLEWARE_DIR_PATH = 'middleware';

type Framework = 'koa' | 'express' | 'egg';

type FrameworkSpecificInfo = {
  templatePath: string;
};

const frameworkSpecificInfo = (framework: Framework): FrameworkSpecificInfo => {
  switch (framework) {
    case 'koa':
      return {
        templatePath: './templates/middleware/koa-middleware.ts.ejs',
      };
    case 'express':
      return {
        templatePath: './templates/middleware/express-middleware.ts.ejs',
      };
    case 'egg':
      return {
        templatePath: './templates/middleware/egg-middleware.ts.ejs',
      };
  }
};

const getMiddlewarerGenPath = (userDir?: string) => {
  const nearestProjectDir = path.dirname(
    findUp.sync(['package.json'], {
      type: 'file',
    })
  );

  const middlewareDirPath = process.env.MW_GEN_LOCAL
    ? path.resolve(__dirname, '../project/src/middleware')
    : path.resolve(
        nearestProjectDir,
        'src',
        userDir ? userDir : DEFAULT_MIDDLEWARE_DIR_PATH
      );

  // fs.ensureDirSync(middlewareDirPath);

  if (process.env.MW_GEN_LOCAL) {
    consola.info('Using local project:');
    consola.info(middlewareDirPath);
  }

  return middlewareDirPath;
};

export const useMiddlewareGenerator = (cli: CAC) => {
  cli
    .command('middleware [name]', 'Generate middleware', {
      allowUnknownOptions: true,
    })
    .alias('m')
    .option('--external [external]', 'Use external lib as middleware', {
      default: false,
    })
    .option('--framework [framework]', 'Target framework', {
      default: 'egg',
    })
    .option(
      '--functional [functional]',
      'Use functional middleware(EggJS only)',
      {
        default: false,
      }
    )
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
    // TODO: interactive mode:  ignore all previous options
    .action(async (name, options) => {
      if (options.dryRun) {
        consola.success('Executing in `dry run` mode, nothing will happen.');
      }

      if (!name) {
        consola.warn('Middleware name cannot be empty!');
        name = await inputPromptStringValue('middleware name', 'tmp');
      }

      if (!['egg', 'koa', 'express'].includes(options.framework)) {
        consola.error('Invalid framework, use one of `egg`/`koa`/`express`');
        process.exit(0);
      }

      const info = frameworkSpecificInfo(options.framework);

      const middlewareNames = names(name);
      const fileNameNames = names(options.fileName ?? name);

      const generatedFilePath = path.resolve(
        getMiddlewarerGenPath(options.dir),
        `${fileNameNames.fileName}.ts`
      );

      consola.info(
        `Middleware will be created in ${chalk.green(generatedFilePath)}`
      );

      const exist = fs.existsSync(generatedFilePath);

      if (exist && !options.override) {
        consola.error(
          'File exist, enable `--override` to override existing file.'
        );
        process.exit(0);
      } else if (exist) {
        consola.warn('overriding exist file');
      }

      const tmp = fs.readFileSync(path.join(__dirname, info.templatePath), {
        encoding: 'utf8',
      });

      const template = EJSCompile(
        tmp,
        {}
      )({
        name: middlewareNames.className,
        useExternalLib: options.external,
        functional: options.functional,
      });

      const outputContent = prettier.format(template, { parser: 'typescript' });

      if (!options.dryRun) {
        fs.ensureFileSync(generatedFilePath);
        fs.writeFileSync(generatedFilePath, outputContent);
      } else {
        consola.success('Middleware generator invoked with:');
        consola.info(`name: ${chalk.cyan(name)}`);
        consola.info(`external: ${chalk.cyan(options.external)}`);
        consola.info(`framework: ${chalk.cyan(options.framework)}`);
        consola.info(`functional: ${chalk.cyan(options.functional)}`);
        consola.info(`override: ${chalk.cyan(options.override)}`);
        consola.info(`file name: ${chalk.cyan(options.fileName ?? name)}`);
        consola.info(`dir: ${chalk.cyan(options.dir)}`);
      }
    });
};
