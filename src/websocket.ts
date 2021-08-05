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
import { names } from './lib/helper';
import consola from 'consola';
import chalk from 'chalk';
import { capitalCase } from './lib/case';
import { ensureDepsInstalled, addNPMScripts } from './lib/package';
import {
  updateDecoratorArrayArgs,
  addImportDeclaration,
  ImportType,
} from './lib/ast';

export enum WebSocketGenerator {
  Setup = 'setup',
  Controller = 'controller',
}

const DEFAULT_CONTROLLER_DIR_PATH = 'controller';
const WS_PKG = ['@midwayjs/ws'];

const scriptKey = 'start:ws';

const scriptValue =
  'cross-env NODE_ENV=local midway-bin dev --ts --entryFile=ws-bootstrap.js';

const getWSGenPath = (projectDir: string, userDir?: string) => {
  const controllerPath = path.resolve(
    projectDir,
    'src',
    userDir ? userDir : DEFAULT_CONTROLLER_DIR_PATH
  );

  const bootstrapFilePath = path.resolve(projectDir, 'ws-bootstrap.js');

  return { controllerPath, bootstrapFilePath };
};

export const useWebSocketGenerator = (cli: CAC) => {
  cli
    .command('ws <type> [name]', 'WebSocket related', {
      allowUnknownOptions: true,
    })
    .option('--file-name [fileName]', 'File name for entity/subscriber')
    .option('--dot-name [dotName]', 'Use dot name like user.entity.ts', {
      default: true,
    })
    .option('--dir [dir]', 'Dir name for generated')
    .option('--dry-run [dryRun]', 'Dry run to see what is happening')
    .action(async (type: WebSocketGenerator, name, options) => {
      try {
        console.log('options: ', options);
        console.log('name: ', name);
        console.log('type: ', type);
        if (options.dryRun) {
          consola.success('Executing in `dry run` mode, nothing will happen.');
        }
        if (
          ![WebSocketGenerator.Controller, WebSocketGenerator.Setup].includes(
            type
          )
        ) {
          consola.error(
            `Invalid generator type ${type}, use one of ${WebSocketGenerator.Setup}/${WebSocketGenerator.Controller}`
          );
          process.exit(0);
        }

        if (type === WebSocketGenerator.Controller && !name) {
          const capitalCaseRequireName = capitalCase(type);
          consola.warn(`${capitalCaseRequireName} name cannot be empty!`);
          name = await inputPromptStringValue(`${type} name`, 'websocket');
        }

        options.dotName = ensureBooleanType(options.dotName);

        const projectDirPath = process.env.GEN_LOCAL
          ? path.resolve(__dirname, '../project')
          : process.cwd();

        consola.info(`Project location: ${chalk.green(projectDirPath)}`);

        switch (type) {
          case WebSocketGenerator.Setup:
            options.dryRun
              ? consola.info('`[DryRun]` Skip dependencies installation check.')
              : await ensureDepsInstalled(WS_PKG, projectDirPath);

            const project = new Project();

            const configurationPath = path.resolve(
              projectDirPath,
              './src/configuration.ts'
            );
            if (!options.dryRun) {
              consola.info('Source code will be transformed.');

              const configurationSource =
                project.addSourceFileAtPath(configurationPath);

              addImportDeclaration(
                configurationSource,
                'ws',
                '@midwayjs/ws',
                ImportType.NAMESPACE_IMPORT
              );

              updateDecoratorArrayArgs(
                configurationSource,
                'Configuration',
                'imports',
                'ws'
              );

              formatTSFile(configurationPath);
            } else {
              consola.info('`[DryRun]` Source code will be transformed.');
            }

            break;

          case WebSocketGenerator.Controller:
            const nameNames = names(name);
            const fileNameNames = names(options.fileName ?? name);

            const writeFileName = options.dotName
              ? `${fileNameNames.fileName}.controller`
              : fileNameNames.fileName;

            const controllerTemplate = fs.readFileSync(
              path.join(__dirname, `./templates/websocket/controller.ts.ejs`),
              { encoding: 'utf8' }
            );

            const bootstrapTemplate = fs.readFileSync(
              path.join(__dirname, `./templates/websocket/bootstrap.js.ejs`),
              { encoding: 'utf8' }
            );

            const renderedControllerContent = EJSCompile(
              controllerTemplate,
              {}
            )({
              name: nameNames.className,
            });

            const outputControllerContent = prettier.format(
              renderedControllerContent,
              {
                parser: 'typescript',
              }
            );

            const outputBootstrapContent = prettier.format(bootstrapTemplate, {
              parser: 'typescript',
            });

            const { controllerPath, bootstrapFilePath } = getWSGenPath(
              projectDirPath,
              options.dir
            );

            const generatedControllerPath = path.resolve(
              controllerPath,
              `${writeFileName}.ts`
            );

            consola.info(
              `WebSocket controller will be created in ${chalk.green(
                generatedControllerPath
              )}`
            );
            consola.info(
              `WebSocket bootstrap will be created in ${chalk.green(
                bootstrapFilePath
              )}`
            );

            if (!options.dryRun) {
              fs.ensureFileSync(generatedControllerPath);
              fs.ensureFileSync(bootstrapFilePath);
              fs.writeFileSync(
                generatedControllerPath,
                outputControllerContent
              );
              fs.writeFileSync(bootstrapFilePath, outputBootstrapContent);

              addNPMScripts(path.resolve(projectDirPath, 'package.json'), [
                {
                  script: scriptKey,
                  content: scriptValue,
                },
              ]);

              consola.info(
                `NPM script added: { ${chalk.cyan(scriptKey)}: ${chalk.cyan(
                  scriptValue
                )} }`
              );
            } else {
              consola.success('WebSocket generator invoked with:');

              consola.info(`type: ${chalk.cyan(type)}`);
              consola.info(`name: ${chalk.cyan(name)}`);
              consola.info(`dot name: ${chalk.cyan(options.dotName)}`);
              fileNameNames.fileName &&
                consola.info(
                  `file name: ${chalk.cyan(fileNameNames.fileName)}`
                );
              options.dir && consola.info(`dir: ${chalk.cyan(options.dir)}`);
              generatedControllerPath &&
                consola.info(
                  `File will be created: ${chalk.green(
                    generatedControllerPath
                  )}`
                );

              bootstrapFilePath &&
                consola.info(
                  `File will be created: ${chalk.green(bootstrapFilePath)}`
                );

              consola.info(
                `NPM script added: { ${chalk.cyan(scriptKey)}: ${chalk.cyan(
                  scriptValue
                )} }`
              );
            }
        }
        consola.success('Generator execution accomplished.');
      } catch (error) {
        consola.fatal('Generator execution failed. \n');
        throw error;
      }
    });
};
