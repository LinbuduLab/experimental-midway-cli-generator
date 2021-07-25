import { CAC } from 'cac';
import * as path from 'path';
import * as fs from 'fs-extra';
import { compile as EJSCompile } from 'ejs';

import * as prettier from 'prettier';
import { ensureBooleanType, inputPromptStringValue } from './lib/helper';
import { names } from './lib/helper';

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

export const injectMiddlewareGenerator = (cli: CAC) => {
  cli
    .command('middleware [name]', 'Generate middleware', {
      allowUnknownOptions: true,
    })
    .alias('m')
    .option(
      '--useExternaLib [useExternaLib]',
      'Use external lib as middleware',
      {
        default: false,
      }
    )
    .option('--framework [framework]', 'Target framework', {
      default: 'egg',
    })
    .option(
      '--format [format]',
      'Format generated content before write into disk',
      {
        default: true,
      }
    )
    .option(
      '--override [override]',
      'Override on file with same target name existing',
      {
        default: true,
      }
    )
    .option('--file-name [fileName]', 'File name for generated')
    .option('--dry-run [dryRun]', 'Dry run to see what is happening')
    // TODO: interactive mode:  ignore all previous options
    .action(async (name, options) => {
      console.log('options: ', options);
      options.useExternaLib = ensureBooleanType(options.useExternaLib);
      options.format = ensureBooleanType(options.format);
      options.override = ensureBooleanType(options.override);

      if (!name) {
        name = await inputPromptStringValue('middleware name');
      }

      if (!['egg', 'koa', 'express'].includes(options.framework)) {
        console.log('invalid framework');
        process.exit(0);
      }

      const info = frameworkSpecificInfo(options.framework);

      const middlewareNames = names(name);
      const fileNameNames = names(options.fileName ?? name);

      const exist = fs.existsSync(
        path.resolve(__dirname, `${fileNameNames.fileName}.ts`)
      );

      if (exist && !options.override) {
        console.log('exist');
        process.exit(0);
      } else if (exist) {
        console.log('overriding exist file');
      }

      const tmp = fs.readFileSync(path.join(__dirname, info.templatePath), {
        encoding: 'utf8',
      });

      const template = EJSCompile(
        tmp,
        {}
      )({ name: middlewareNames.className, useExternalLib: true });

      const outputContent = options.format
        ? prettier.format(template, { parser: 'typescript' })
        : template;

      fs.writeFileSync(
        path.resolve(__dirname, `${fileNameNames.fileName}.ts`),
        outputContent
      );
    });
};
