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
// relation

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
    // entity specified option
    .option('--active-record [activeRecord]', 'Use active record mode', {
      default: true,
    })
    .option(
      '--relation [relation]',
      '[Entity generator only] create relation entity',
      {
        default: true,
      }
    )
    // subscriber specified option
    // .option('--listen-all [listenAll]', 'Listen to all entities', {
    //   default: true,
    // })
    .option('--transaction [transaction]', 'Listen to transactions', {
      default: true,
    })

    // ---
    .option(
      '--format [format]',
      'Format generated content before write into disk',
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
      options.relation = ensureBooleanType(options.relation);
      options.dotName = ensureBooleanType(options.dotName);
      options.transaction = ensureBooleanType(options.transaction);

      console.log('options: ', options);

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
          const writeFileNameEntity = options.dotName
            ? `${fileNameNames.fileName}.entity`
            : fileNameNames.fileName;

          const tmpEntity = fs.readFileSync(
            path.join(
              __dirname,
              `./templates/typeorm/${
                options.relation
                  ? 'relation-entity.ts.ejs'
                  : 'plain-entity.ts.ejs'
              }`
            ),
            { encoding: 'utf8' }
          );

          const templateEntity = EJSCompile(
            tmpEntity,
            {}
          )({
            entity: nameNames.className,
            activeRecord: options.activeRecord,
          });

          const outputContentEntity = options.format
            ? prettier.format(templateEntity, { parser: 'typescript' })
            : templateEntity;

          finalFileName = `${writeFileNameEntity}.ts`;
          finalFileContent = outputContentEntity;

          break;

        case TypeORMGenerator.SUBSCRIBER:
          const writeFileName = options.dotName
            ? `${fileNameNames.fileName}.subscriber`
            : fileNameNames.fileName;

          const tmp = fs.readFileSync(
            path.join(__dirname, './templates/typeorm/subscriber.ts.ejs'),
            { encoding: 'utf8' }
          );

          const template = EJSCompile(
            tmp,
            {}
          )({
            subscriber: nameNames.className,
            transaction: options.transaction,
          });

          const outputContent = options.format
            ? prettier.format(template, { parser: 'typescript' })
            : template;

          finalFileName = `${writeFileName}.ts`;
          finalFileContent = outputContent;

          break;
      }

      fs.writeFileSync(
        path.resolve(__dirname, finalFileName),
        finalFileContent
      );
    });
};
