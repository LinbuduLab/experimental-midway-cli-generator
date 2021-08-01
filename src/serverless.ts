import { CAC } from 'cac';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as prettier from 'prettier';
import { compile as EJSCompile } from 'ejs';

import * as yaml from 'js-yaml';
import { ensureBooleanType, inputPromptStringValue, names } from './lib/helper';

type SLSGeneratorType = 'faas' | 'aggr';

function yamlRelated(
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
    .option('--file-name [fileName]', 'File name', {})
    .option('--dry-run [dryRun]', 'Dry run to see what is happening')
    .action(async (name, type: SLSGeneratorType, options) => {
      options.http = ensureBooleanType(options.http);
      options.event = ensureBooleanType(options.event);
      options.gateway = ensureBooleanType(options.gateway);
      options.timer = ensureBooleanType(options.timer);
      options.oss = ensureBooleanType(options.oss);

      if (!type) {
        type = 'faas';
      }

      if (!['faas', 'aggr'].includes(type)) {
        console.log('invalid type, applying: faas');
        type = 'faas';
      }

      const isFaaSType = type === 'faas';

      if (!name) {
        name = await inputPromptStringValue(
          isFaaSType ? 'function service name' : 'aggregation class name',
          isFaaSType ? 'Functions' : 'Aggr'
        );
      }

      let finalFileName: string;
      let finalFileContent: string;

      // const nameNames = names(name).className.includes(' ') ? name : name(name);
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

      const outputContent = prettier.format(template, { parser: 'typescript' });

      finalFileName = `${fileNameNames.fileName}.ts`;
      finalFileContent = outputContent;

      fs.writeFileSync(
        path.resolve(__dirname, finalFileName),
        finalFileContent
      );
    });
};
