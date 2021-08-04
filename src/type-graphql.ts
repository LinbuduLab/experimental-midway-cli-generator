import { CAC } from 'cac';
import * as path from 'path';
import * as fs from 'fs-extra';
import { compile as EJSCompile } from 'ejs';

import * as prettier from 'prettier';
import { ensureBooleanType, inputPromptStringValue } from './lib/helper';
import { names } from './lib/helper';
import consola from 'consola';
import chalk from 'chalk';
import findUp from 'find-up';
import { capitalCase } from './lib/case';

export enum TypeGraphQLGenerator {
  SETUP = 'SETUP',
  OBJECT_TYPE = 'OBJECT',
  INPUT_TYPE = 'INPUT',
  INTERFACE_TYPE = 'INTERFACE',
  SCALAR = 'SCALAR',
  ENUM = 'ENUM',
  DIRECTIVE = 'DIRECTIVE',
  UNION = 'UNION',
  MIDDLEWARE = 'MIDDLEWARE',
  RESOLVER = 'RESOLVER',
}

export enum MiddlewareType {
  FUNCTIONAL = 'FUNCTIONAL',
  FACTORY = 'FACTORY',
  CLASS = 'CLASS',
  GUARD = 'GUARD',
}

const baseTypes = ['object', 'input', 'interface', 'resolver', 'middleware'];

const componentTypes = ['scalar', 'eunm', 'directive', 'union'];

const DEFAULT_GRAPHQL_DIR_PATH = 'graphql';
const DEFAULT_OBJECT_TYPE_DIR_PATH = 'graphql/type';
const DEFAULT_MIDDLEWARE_DIR_PATH = 'graphql/middleware';
const DEFAULT_RESOLVER_DIR_PATH = 'graphql/resolver';

// 一期：
// ObjectType、Resolver、Middleware
// Setup:
// 安装type-graphql graphql
// 确保tsconfig配置正确

const getTypeGraphQLGenPath = (userDir?: string) => {
  const nearestProjectDir = path.dirname(
    findUp.sync(['package.json'], {
      type: 'file',
    })
  );

  const typePath = process.env.MW_GEN_LOCAL
    ? path.resolve(__dirname, '../project/src/graphql/type')
    : path.resolve(
        nearestProjectDir,
        'src',
        userDir ? userDir : DEFAULT_OBJECT_TYPE_DIR_PATH
      );

  const middlewarePath = process.env.MW_GEN_LOCAL
    ? path.resolve(__dirname, '../project/src/graphql/middleware')
    : path.resolve(
        nearestProjectDir,
        'src',
        userDir ? userDir : DEFAULT_MIDDLEWARE_DIR_PATH
      );

  const resolverPath = process.env.MW_GEN_LOCAL
    ? path.resolve(__dirname, '../project/src/graphql/resolver')
    : path.resolve(
        nearestProjectDir,
        'src',
        userDir ? userDir : DEFAULT_RESOLVER_DIR_PATH
      );

  if (process.env.MW_GEN_LOCAL) {
    consola.info('Using local project:');
    consola.info(`typePath: ${typePath}`);
    consola.info(`middlewarePath: ${middlewarePath}`);
    consola.info(`resolverPath: ${resolverPath}`);
  }

  return {
    typePath,
    middlewarePath,
    resolverPath,
  };
};

export const useTypeGraphQLGenerator = (cli: CAC) => {
  cli
    .command('graphql <type> [name]', 'TypeGraphQL generatore', {
      allowUnknownOptions: true,
    })
    .alias('gql')
    // ObjectType specified option
    .option('--orm [orm]', 'Add TypeORM decorator to ObjectType', {
      default: false,
    })
    // Resolver specified option
    .option('--field [field]', 'Add FieldResolver', {
      default: true,
    })
    // Middleware specified option
    .option('--mw-type [mwType]', 'Choose middleware type', {
      default: 'functional',
    })
    .option('--file-name [fileName]', 'File name for Mw/subscriber')
    .option('--dot-name [dotName]', 'Use dot name like user.Mw.ts', {
      default: true,
    })
    .option('--dir [dir]', 'Dir name for generated')
    .option('--dry-run [dryRun]', 'Dry run to see what is happening')
    .action(async (type: TypeGraphQLGenerator, name, options) => {
      if (options.dryRun) {
        consola.success('Executing in `dry run` mode, nothing will happen.');
      }

      if (![...baseTypes, ...componentTypes, 'setup'].includes(type)) {
        consola.error(`Invalid generator type: ${type}`);
        process.exit(0);
      }

      options.orm = ensureBooleanType(options.orm);
      options.field = ensureBooleanType(options.field);
      options.dotName = ensureBooleanType(options.dotName);

      if (
        type.toLocaleUpperCase() === TypeGraphQLGenerator.MIDDLEWARE &&
        !['functional', 'class', 'guard', 'factory'].includes(options.mwType)
      ) {
        consola.error(`Invalid middleware type: ${type}`);
        options.type = 'functional';
      }

      if (type.toLocaleUpperCase() !== TypeGraphQLGenerator.SETUP && !name) {
        const capitalCaseRequireName = capitalCase(type);
        consola.warn(`${capitalCaseRequireName} name cannot be empty!`);
        name = await inputPromptStringValue(`${type} name`, 'tmp');
      }

      let finalFilePath: string;
      let finalFileContent: string;

      const nameNames = names(name);
      const fileNameNames = names(options.fileName ?? name);

      switch (type.toLocaleUpperCase()) {
        case TypeGraphQLGenerator.SETUP:
          if (name) {
            console.log('ignored extra args in setup generator');
          }

          consola.error('Not Support Yet');

          break;

        case TypeGraphQLGenerator.OBJECT_TYPE:
          const writeFileNameObjType = options.dotName
            ? `${fileNameNames.fileName}.type`
            : fileNameNames.fileName;

          const tmpObjType = fs.readFileSync(
            path.join(__dirname, `./templates/type-graphql/ObjectType.ts.ejs`),
            { encoding: 'utf8' }
          );

          const templateObjType = EJSCompile(
            tmpObjType,
            {}
          )({
            typeName: nameNames.className,
            orm: options.orm,
          });

          const { typePath } = getTypeGraphQLGenPath(options.dir);

          const outputContentObjType = prettier.format(templateObjType, {
            parser: 'typescript',
          });

          finalFilePath = path.resolve(typePath, `${writeFileNameObjType}.ts`);

          consola.info(
            `ObjectType will be created in ${chalk.green(finalFilePath)}`
          );

          finalFileContent = outputContentObjType;
          break;

        case TypeGraphQLGenerator.MIDDLEWARE:
          const writeFileNameMw = options.dotName
            ? `${fileNameNames.fileName}`
            : fileNameNames.fileName;

          const tmpMw = fs.readFileSync(
            path.join(__dirname, `./templates/type-graphql/Middleware.ts.ejs`),
            { encoding: 'utf8' }
          );

          const templateMw = EJSCompile(
            tmpMw,
            {}
          )({
            mwName: nameNames.className,
            type: options.type,
          });

          const outputContentMw = prettier.format(templateMw, {
            parser: 'typescript',
          });

          const { middlewarePath } = getTypeGraphQLGenPath(options.dir);

          finalFilePath = path.resolve(middlewarePath, `${writeFileNameMw}.ts`);

          consola.info(
            `Middleware will be created in ${chalk.green(finalFilePath)}`
          );

          finalFileContent = outputContentMw;
          break;

        case TypeGraphQLGenerator.RESOLVER:
          const writeFileNameResolver = options.dotName
            ? `${fileNameNames.fileName}.resolver`
            : fileNameNames.fileName;

          const tmpResolver = fs.readFileSync(
            path.join(__dirname, `./templates/type-graphql/Resolver.ts.ejs`),
            { encoding: 'utf8' }
          );

          const templateResolver = EJSCompile(
            tmpResolver,
            {}
          )({
            name: nameNames.className,
            field: options.field,
          });

          const outputContentResolver = prettier.format(templateResolver, {
            parser: 'typescript',
          });

          const { resolverPath } = getTypeGraphQLGenPath(options.dir);

          finalFilePath = path.resolve(
            resolverPath,
            `${writeFileNameResolver}.ts`
          );

          consola.info(
            `Resolver will be created in ${chalk.green(finalFilePath)}`
          );

          finalFileContent = outputContentResolver;
          break;
      }

      if (!options.dryRun) {
        fs.writeFileSync(finalFilePath, finalFileContent);
      } else {
        consola.success('TypeGraphQL generator invoked with:');
        consola.info(`type: ${chalk.cyan(type)}`);
        type.toLocaleUpperCase() !== TypeGraphQLGenerator.SETUP &&
          consola.info(`name: ${chalk.cyan(name)}`);

        if (type.toLocaleUpperCase() === TypeGraphQLGenerator.OBJECT_TYPE) {
          consola.info(`orm: ${chalk.cyan(options.orm)}`);
        }

        if (type.toLocaleUpperCase() === TypeGraphQLGenerator.MIDDLEWARE) {
          consola.info(`mw-type: ${chalk.cyan(options.mwType)}`);
        }

        if (type.toLocaleUpperCase() === TypeGraphQLGenerator.RESOLVER) {
          consola.info(`field: ${chalk.cyan(options.field)}`);
        }

        consola.info(`dot name: ${chalk.cyan(options.dotName)}`);
        consola.info(`file name: ${chalk.cyan(fileNameNames.fileName)}`);
        consola.info(`dir: ${chalk.cyan(options.dir)}`);

        consola.info(`File will be created: ${chalk.green(finalFilePath)}`);
      }
    });
};
