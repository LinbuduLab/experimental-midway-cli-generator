import { CAC } from 'cac';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as prettier from 'prettier';
import { compile as EJSCompile } from 'ejs';

import * as yaml from 'js-yaml';
import { ensureBooleanType, inputPromptStringValue, names } from './lib/helper';
import consola from 'consola';
import chalk from 'chalk';
import findUp from 'find-up';

type SLSGeneratorType = 'faas' | 'aggr';

const DEFAULT_FAAS_DIR_PATH = 'functions';
const DEFAULT_AGGR_DIR_PATH = 'controller';

const getSLSGenPath = (userDir?: string) => {
  const nearestProjectDir = path.dirname(
    findUp.sync(['package.json'], {
      type: 'file',
    })
  );

  const faasPath = process.env.MW_GEN_LOCAL
    ? path.resolve(__dirname, '../project/src/functions')
    : path.resolve(
        nearestProjectDir,
        'src',
        userDir ? userDir : DEFAULT_FAAS_DIR_PATH
      );

  const aggrPath = process.env.MW_GEN_LOCAL
    ? path.resolve(__dirname, '../project/src/controller')
    : path.resolve(
        nearestProjectDir,
        'src',
        userDir ? userDir : DEFAULT_AGGR_DIR_PATH
      );

  if (process.env.MW_GEN_LOCAL) {
    consola.info('Using local project:');
    consola.info(`faasPath: ${faasPath}`);
    consola.info(`aggrPath: ${aggrPath}`);
  }

  return { faasPath, aggrPath };
};

function yamlHandler(
  serviceName: string,
  originPath: string,
  outputPath: string,
  useAggr = false
) {
  const origin = fs.readFileSync(originPath, 'utf-8');
  const doc = yaml.load(origin) as any;

  doc.service.name = serviceName;

  if (useAggr) {
    doc.aggregation.all.functionsPattern = '*';
  }

  fs.writeFileSync(yaml.dump(doc), outputPath);
}

export const useServerlessGenerator = (cli: CAC) => {
  cli
    .command(
      'sls [type] [name]',
      'Generate Serverless functions (common / aggregation)',
      {
        allowUnknownOptions: true,
      }
    )
    .option('--http [http]', 'Use http trigger', {
      default: true,
    })
    .option('--event [event]', 'Add event trigger', {
      default: false,
    })
    .option('--gateway [gateway]', 'Add gateway trigger', {
      default: false,
    })
    .option('--timer [timer]', 'Add timer trigger', {
      default: false,
    })
    .option('--timer [oss]', 'Add oss trigger', {
      default: false,
    })
    .option('--file-name [fileName]', 'File name')
    .option('--dir [dir]', 'Dir name for generated')
    .option('--dry-run [dryRun]', 'Dry run to see what is happening')
    .action(async (name, type: SLSGeneratorType, options) => {
      try {
        if (options.dryRun) {
          consola.success('Executing in `dry run` mode, nothing will happen.');
        }

        options.http = ensureBooleanType(options.http);
        options.event = ensureBooleanType(options.event);
        options.gateway = ensureBooleanType(options.gateway);
        options.timer = ensureBooleanType(options.timer);
        options.oss = ensureBooleanType(options.oss);

        if (!type) {
          consola.warn('No type input, applying default type: `faas`');
          type = 'faas';
        }

        if (!['faas', 'aggr'].includes(type)) {
          consola.error('Invalid type, applying default type: `faas`');
          type = 'faas';
        }

        const isFaaSType = type === 'faas';

        if (!name) {
          name = await inputPromptStringValue(
            isFaaSType ? 'function service name' : 'aggregation class name',
            isFaaSType ? 'Function' : 'Aggr'
          );
        }

        const nameNames = names(name);
        const fileNameNames = names(options.fileName ?? name);

        const originContent = fs.readFileSync(
          path.join(
            __dirname,
            `./templates/serverless/${
              isFaaSType ? 'function.ts.ejs' : 'aggr.ts.ejs'
            }`
          ),
          { encoding: 'utf8' }
        );

        const template = EJSCompile(
          originContent,
          {}
        )({
          [isFaaSType ? '__Function_Name__' : '__Class_Name__']:
            nameNames.className,
          event: options.event,
          oss: options.oss,
          gateway: options.gateway,
          timer: options.timer,
          http: options.http,
        });

        const outputContent = prettier.format(template, {
          parser: 'typescript',
        });
        const outputPath = getSLSGenPath(options.dir);

        const finalFilePath = path.resolve(
          isFaaSType ? outputPath.faasPath : outputPath.aggrPath,
          `${fileNameNames.fileName}.ts`
        );

        if (!options.dryRun) {
          fs.writeFileSync(finalFilePath, outputContent);
        } else {
          consola.success('Serverless generator invoked with:');
          consola.info(`type: ${chalk.cyan(type)}`);

          consola.info(`http: ${chalk.cyan(options.http)}`);
          consola.info(`event: ${chalk.cyan(options.event)}`);
          consola.info(`gateway: ${chalk.cyan(options.gateway)}`);
          consola.info(`timer: ${chalk.cyan(options.timer)}`);
          consola.info(`oss: ${chalk.cyan(options.oss)}`);

          consola.info(`file name: ${chalk.cyan(fileNameNames.fileName)}`);
          consola.info(`dir: ${chalk.cyan(options.dir)}`);

          consola.info(`File will be created: ${chalk.green(finalFilePath)}`);
        }
        consola.success('Generator execution accomplished.');
      } catch (error) {
        consola.fatal('Generator execution failed. \n');
        throw error;
      }
    });
};
