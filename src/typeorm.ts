import { CAC } from 'cac';
import * as path from 'path';
import * as fs from 'fs-extra';
import { Project } from 'ts-morph';
import { compile as EJSCompile } from 'ejs';

import * as prettier from 'prettier';
import {
  ensureBooleanType,
  inputPromptStringValue,
  formatTSFile,
} from './lib/helper';
import { names, updateGitIgnore } from './lib/helper';
import consola from 'consola';
import chalk from 'chalk';
import findUp from 'find-up';
import { capitalCase } from './lib/case';
import { checkDepExist, installDep } from './lib/package';
import { addConstExport, updateDecoratorArrayArgs } from './lib/ast';
import { addImportDeclaration, ImportType } from './lib/ast/import';

// setup：
// 检查是否安装
// 没有

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

const DEFAULT_ENTITY_DIR_PATH = 'entity';
const DEFAULT_SUBSCRIBER_DIR_PATH = 'entity/subscriber';
const ORM_PKG = '@midwayjs/orm';

const getTypeORMGenPath = (userDir?: string) => {
  const nearestProjectDir = path.dirname(
    findUp.sync(['package.json'], {
      type: 'file',
    })
  );

  const entityPath = process.env.MW_GEN_LOCAL
    ? path.resolve(__dirname, '../project/src/entity')
    : path.resolve(
        nearestProjectDir,
        'src',
        userDir ? userDir : DEFAULT_ENTITY_DIR_PATH
      );

  const subscriberPath = process.env.MW_GEN_LOCAL
    ? path.resolve(__dirname, '../project/src/entity/subscriber')
    : path.resolve(
        nearestProjectDir,
        'src',
        userDir ? userDir : DEFAULT_SUBSCRIBER_DIR_PATH
      );

  if (process.env.MW_GEN_LOCAL) {
    consola.info('Using local project:');
    consola.info(`entityPath: ${entityPath}`);
    consola.info(`subscriberPath: ${subscriberPath}`);
  }

  return { entityPath, subscriberPath };
};

export const useTypeORMGenerator = (cli: CAC) => {
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

    .option('--file-name [fileName]', 'File name for entity/subscriber')
    .option('--dot-name [dotName]', 'Use dot name like user.entity.ts', {
      default: true,
    })
    .option('--dir [dir]', 'Dir name for generated')
    .option('--dry-run [dryRun]', 'Dry run to see what is happening')
    .action(async (type: TypeORMGenerator, name, options) => {
      try {
        if (options.dryRun) {
          consola.success('Executing in `dry run` mode, nothing will happen.');
        }

        if (!['setup', 'entity', 'subscriber'].includes(type)) {
          consola.error(
            `Invalid generator type: ${type}, use one of setup/entiy/subscriber`
          );
          process.exit(0);
        }

        if (['entity', 'subscriber'].includes(type) && !name) {
          const capitalCaseRequireName = capitalCase(type);
          consola.warn(`${capitalCaseRequireName} name cannot be empty!`);
          name = await inputPromptStringValue(`${type} name`, 'tmp');
        }

        options.activeRecord = ensureBooleanType(options.activeRecord);
        options.relation = ensureBooleanType(options.relation);
        options.dotName = ensureBooleanType(options.dotName);
        options.transaction = ensureBooleanType(options.transaction);

        let finalFilePath: string;
        let finalFileContent: string;

        const nameNames = names(name ?? '');
        const fileNameNames = names(options.fileName ?? name ?? '');

        switch (type.toLocaleUpperCase()) {
          case TypeORMGenerator.SETUP:
            const projectDirPath = process.env.GEN_LOCAL
              ? path.resolve(__dirname, '../project')
              : process.cwd();

            consola.info(`Project location: ${chalk.green(projectDirPath)}`);

            if (!checkDepExist(ORM_PKG, projectDirPath)) {
              consola.info(`Installing ${chalk.cyan(ORM_PKG)}...`);
              options.dryRun
                ? consola.info('`[DryRun]` No deps will be installed.')
                : installDep(ORM_PKG, false, projectDirPath);
            }

            const project = new Project();

            const configPath = path.resolve(
              projectDirPath,
              './src/config/config.default.ts'
            );

            const configSource = project.addSourceFileAtPath(configPath);

            const configurationPath = path.resolve(
              projectDirPath,
              './src/configuration.ts'
            );

            if (!options.dryRun) {
              consola.info('Source code will be transformed.');
              // 新增export const orm = {}
              addConstExport(configSource, 'orm', { type: 'sqlite' });

              formatTSFile(configPath);

              const configurationSource =
                project.addSourceFileAtPath(configurationPath);

              addImportDeclaration(
                configurationSource,
                'orm',
                '@midwayjs/orm',
                ImportType.NAMESPACE_IMPORT
              );

              updateDecoratorArrayArgs(
                configurationSource,
                'Configuration',
                'imports',
                'orm'
              );

              formatTSFile(configurationPath);
            } else {
              consola.info('`[DryRun]` Source code will be transformed.');
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

            const outputContentEntity = prettier.format(templateEntity, {
              parser: 'typescript',
            });

            const { entityPath: entityDirPath } = getTypeORMGenPath(
              options.dir
            );

            finalFilePath = path.resolve(
              entityDirPath,
              `${writeFileNameEntity}.ts`
            );

            consola.info(
              `Entity will be created in ${chalk.green(finalFilePath)}`
            );

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

            const outputContent = prettier.format(template, {
              parser: 'typescript',
            });

            const { subscriberPath: subscriberDirPath } = getTypeORMGenPath(
              options.dir
            );

            finalFilePath = path.resolve(
              subscriberDirPath,
              `${writeFileName}.ts`
            );

            consola.info(
              `Subscriber will be created in ${chalk.green(finalFilePath)}`
            );

            finalFileContent = outputContent;

            break;
        }

        if (!options.dryRun) {
          if (type.toLocaleUpperCase() !== TypeORMGenerator.SETUP) {
            fs.ensureFileSync(finalFilePath);
            fs.writeFileSync(finalFilePath, finalFileContent);
          }
        } else {
          consola.success('TypeORM generator invoked with:');
          consola.info(`type: ${chalk.cyan(type)}`);
          ['entity', 'subscriber'].includes(type) &&
            consola.info(`name: ${chalk.cyan(name)}`);

          if (type.toLocaleUpperCase() === TypeORMGenerator.ENTITY) {
            consola.info(`active record: ${chalk.cyan(options.activeRecord)}`);
            consola.info(`relation: ${chalk.cyan(options.relation)}`);
          }

          if (type.toLocaleUpperCase() === TypeORMGenerator.SUBSCRIBER) {
            consola.info(`transaction: ${chalk.cyan(options.transaction)}`);
          }

          consola.info(`dot name: ${chalk.cyan(options.dotName)}`);
          fileNameNames.fileName &&
            consola.info(`file name: ${chalk.cyan(fileNameNames.fileName)}`);
          options.dir && consola.info(`dir: ${chalk.cyan(options.dir)}`);

          finalFilePath &&
            consola.info(`File will be created: ${chalk.green(finalFilePath)}`);
        }

        consola.success('Generator execution accomplished.');
      } catch (error) {
        consola.fatal('Generator execution failed. \n');
        throw error;
      }
    });
};
