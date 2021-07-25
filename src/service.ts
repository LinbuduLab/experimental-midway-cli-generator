import { CAC } from 'cac';
import * as path from 'path';
import * as fs from 'fs-extra';
import { compile as EJSCompile } from 'ejs';

import * as prettier from 'prettier';
import { ensureBooleanType, inputPromptStringValue } from './lib/helper';
import { names } from './lib/helper';

export const injectServiceGenerator = (cli: CAC) => {
  cli
    .command('service [name]', 'Generate service', {
      allowUnknownOptions: true,
    })
    .alias('s')
    // use dot name like app.controller.ts
    .option('--dot-name [dotName]', 'Use dot file name', {
      default: true,
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
    .action(async (name, options) => {
      options.dotName = ensureBooleanType(options.dotName);
      options.format = ensureBooleanType(options.format);
      options.override = ensureBooleanType(options.override);

      if (!name) {
        name = await inputPromptStringValue('service name');
      }

      const serviceNames = names(name);
      const fileNameNames = names(options.fileName ?? name);

      console.log('options: ', options);

      const fileName = options.dotName
        ? `${fileNameNames.dotName}.service`
        : fileNameNames.fileName;

      const exist = fs.existsSync(path.resolve(__dirname, `${fileName}.ts`));

      if (exist && !options.override) {
        console.log('exist');
        process.exit(0);
      } else if (exist) {
        console.log('overriding exist file');
      }

      const tmp = fs.readFileSync(
        path.join(__dirname, `./templates/service/${'service.ts.ejs'}`),
        { encoding: 'utf8' }
      );

      const template = EJSCompile(tmp, {})({ name: serviceNames.className });

      const outputContent = options.format
        ? prettier.format(template, { parser: 'typescript' })
        : template;

      fs.writeFileSync(
        path.resolve(__dirname, `${fileName}.ts`),
        outputContent
      );
    });
};
