import { CAC } from 'cac';
import * as path from 'path';
import * as fs from 'fs-extra';
import { compile as EJSCompile } from 'ejs';

import * as prettier from 'prettier';
import { ensureBooleanType, inputPromptStringValue } from './lib/helper';
import { names } from './lib/helper';
import { constantCase } from './lib/case/constant-case';

export enum TypeGraphQLGenerator {
  SETUP = 'SETUP',
  OBJECT_TYPE = 'OBJECT_TYPE',
  INPUT_TYPE = 'INPUT_TYPE',
  INTERFACE_TYPE = 'INTERFACE_TYPE',
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

const baseTypes = [
  'ObjectType',
  'InputType',
  'InterfaceType',
  'Resolver',
  'Middleware',
];

const componentTypes = ['Scalar', 'Enum', 'Directive', 'Union'];

// 一期：
// ObjectType、Resolver、Middleware
// Setup

export const injectTypeGraphQLGenerator = (cli: CAC) => {
  cli
    .command('tgql <type> [name]', 'TypeORM related', {
      allowUnknownOptions: true,
    })
    // ObjectType specified option
    .option('--orm [orm]', 'Add TypeORM decorator to ObjectType', {
      default: false,
    })
    // Resolver specified option
    .option('--field [field]', 'Add FieldResolver', {
      default: true,
    })
    // Middleware specified option
    .option('--type [type]', 'Choose middleware type', {
      default: 'functional',
    })
    .option('--file-name [fileName]', 'File name for Mw/subscriber')
    .option('--dot-name [dotName]', 'Use dot name like user.Mw.ts', {
      default: true,
    })
    .option('--dry-run [dryRun]', 'Dry run to see what is happening')
    .action(async (type: TypeGraphQLGenerator, name, options) => {
      if (![...baseTypes, ...componentTypes, 'setup'].includes(type)) {
        console.log('invalid sub-command ');
        process.exit(0);
      }

      options.orm = ensureBooleanType(options.orm);
      options.field = ensureBooleanType(options.field);

      if (
        !['functional', 'class', 'guard', 'factory', ''].includes(options.type)
      ) {
        options.type = 'functional';
      }

      let finalFileName: string;
      let finalFileContent: string;

      const nameNames = names(name);
      const fileNameNames = names(options.fileName ?? name);

      switch (constantCase(type)) {
        case TypeGraphQLGenerator.SETUP:
          if (name) {
            console.log('ignored extra args in setup generator');
          }

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

          const outputContentObjType = prettier.format(templateObjType, {
            parser: 'typescript',
          });

          finalFileName = `${writeFileNameObjType}.ts`;
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

          finalFileName = `${writeFileNameMw}.ts`;
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

          finalFileName = `${writeFileNameResolver}.ts`;
          finalFileContent = outputContentResolver;
          break;
      }

      fs.writeFileSync(
        path.resolve(__dirname, finalFileName),
        finalFileContent
      );
    });
};
