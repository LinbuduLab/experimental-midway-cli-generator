import { CAC } from 'cac';
import * as path from 'path';
import * as fs from 'fs-extra';
import { compile as EJSCompile } from 'ejs';

import * as prettier from 'prettier';
import { ensureBooleanType, inputPromptStringValue } from './lib/helper';
import { names } from './lib/helper';

// mw g component orm setup/entity
// mw g component tgql --interactive
// (default as setup)

// entity:
// plain
// relationed

// subscriber:
//

// active record -> extends BaseEntity

export enum TypeORMGenerator {
  SETUP = 'SETUP',
  ENTITY = 'ENTITY',
  SUBSCRIBER = 'SUBSCRIBER',
}

export const injectTypeORMGenerator = (cli: CAC) => {
  cli
    .command('orm <type> [name]', 'TypeORM related', {
      allowUnknownOptions: true,
    })
    .option('--active-record [activeRecord]', 'Use active record mode', {
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
      '--relationed [relationed]',
      '[Entity generator only] create relationed entity',
      {
        default: true,
      }
    )
    .option('--file-name [fileName]', 'File name for entity/subscriber')
    .option('--dot-name [dotName]', 'Use dot name like user.entity.ts', {
      default: true,
    })
    .option('--dry-run [dryRun]', 'Dry run to see what is happening')
    .action(async (type: TypeORMGenerator, name, options) => {
      if (!['setup', 'entity', 'subscriber'].includes(type)) {
        console.log('invalid sub-command ');
        process.exit(0);
      }
      options.activeRecord = ensureBooleanType(options.activeRecord);
      options.relationed = ensureBooleanType(options.relationed);
      options.dotName = ensureBooleanType(options.dotName);
      console.log('options: ', options);
      console.log('name: ', name);
      console.log('type: ', type);

      let finalFileName: string;
      let finalFileContent: string;

      const nameNames = names(name);
      const fileNameNames = names(options.fileName ?? name);

      switch (type.toLocaleUpperCase()) {
        case TypeORMGenerator.SETUP:
          if (name) {
            console.log('ignored extra args in setup generator');
          }

          break;

        case TypeORMGenerator.ENTITY:
          const writeFileName = options.dotName
            ? `${fileNameNames.fileName}.entity`
            : fileNameNames.fileName;

          const tmp = fs.readFileSync(
            path.join(
              __dirname,
              `./templates/typeorm/${
                options.relationed
                  ? 'plain-entity.ts.ejs'
                  : 'relationed-entity.ts.ejs'
              }`
            ),
            { encoding: 'utf8' }
          );

          const template = EJSCompile(
            tmp,
            {}
          )({
            entity: nameNames.className,
            activeRecord: options.activeRecord,
          });

          const outputContent = options.format
            ? prettier.format(template, { parser: 'typescript' })
            : template;

          finalFileName = `${writeFileName}.ts`;
          finalFileContent = outputContent;

          // fs.writeFileSync(
          //   path.resolve(__dirname, `${writeFileName}.ts`),
          //   outputContent
          // );

          break;

        case TypeORMGenerator.SUBSCRIBER:
          break;
      }

      console.log('??');

      fs.writeFileSync(
        path.resolve(__dirname, finalFileName),
        finalFileContent
      );
    });
};
