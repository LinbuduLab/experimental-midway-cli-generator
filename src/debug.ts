import { CAC } from 'cac';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as findUp from 'find-up';
import * as prettier from 'prettier';
import { ensureBooleanType, inputPromptStringValue } from './lib/helper';
import * as jsonfile from 'jsonfile';

export const injectDebuggerGenerator = (cli: CAC) => {
  cli
    .command('debug [name]', 'Generate launch.json for VS Code debug', {
      allowUnknownOptions: true,
    })
    .alias('d')
    .option('--port [port]', 'Debugger port', {
      default: 7001,
    })
    .option('--restart [restart]', 'Restart debugger', {
      default: true,
    })
    .option(
      '--format [format]',
      'Format generated content before write into disk',
      {
        default: true,
      }
    )
    .option('--dry-run [dryRun]', 'Dry run to see what is happening')
    .action(async (name, options) => {
      options.restart = ensureBooleanType(options.restart);
      options.format = ensureBooleanType(options.format);

      if (!name) {
        // name = await inputPromptStringValue(
        //   'debug configuration name',
        //   'Midway Local'
        // );
        name = 'Midway Local';
      }

      const filePath = '.vscode/launch.json';

      const absConfigurationPath = path.join(
        path.dirname(findUp.sync('package.json')),
        filePath
      );

      const prevExist = fs.existsSync(absConfigurationPath);

      // use midway built-in api to get correct workspace path
      fs.ensureFileSync(absConfigurationPath);

      let prevContent: any = {};

      try {
        prevContent = jsonfile.readFileSync(absConfigurationPath);
      } catch (error) {
        prevContent = {};
      }

      let writeContent: any = {};

      const createDebuggerConfiguration = (updatedName?: string) => ({
        name: updatedName ?? name,
        type: 'node',
        request: 'launch',
        cwd: '${workspaceRoot}',
        runtimeExecutable: 'npm',
        windows: {
          runtimeExecutable: 'npm.cmd',
        },
        runtimeArgs: ['run', 'dev'],
        env: {
          NODE_ENV: 'local',
        },
        console: 'integratedTerminal',
        protocol: 'auto',
        restart: options.restart,
        port: options.port,
        autoAttachChildProcesses: true,
      });

      if (
        !prevExist ||
        !Object.keys(prevContent).length ||
        !Object.keys(prevContent.configuration).length
      ) {
        writeContent.version = '0.2.0';
        writeContent.configuration = [createDebuggerConfiguration()];
      } else if (prevContent.configuration.length) {
        if (
          (prevContent.configuration as any[]).filter(
            config => config.name === name
          ).length
        ) {
          name = `${name} 2`;
        }
        writeContent.configuration = prevContent.configuration;
        writeContent.configuration.push(createDebuggerConfiguration(name));
      }

      fs.writeFileSync(
        absConfigurationPath,
        options.format
          ? prettier.format(JSON.stringify(writeContent), { parser: 'json' })
          : JSON.stringify(writeContent)
      );
    });
};
