import { CAC } from 'cac';
import path from 'path';
import fs from 'fs-extra';
import findUp from 'find-up';
import prettier from 'prettier';
import { inputPromptStringValue } from './lib/helper';
import jsonfile from 'jsonfile';
import consola from 'consola';
import chalk from 'chalk';

const DEFAULT_DEBUG_FILE_PATH = '.vscode/launch.json';

const getDebugGenPath = () => {
  const nearestProjectDir = path.dirname(
    findUp.sync(['package.json'], {
      type: 'file',
    })
  );

  const debugPath = process.env.MW_GEN_LOCAL
    ? path.resolve(__dirname, '../project', DEFAULT_DEBUG_FILE_PATH)
    : path.resolve(nearestProjectDir, DEFAULT_DEBUG_FILE_PATH);

  fs.ensureFileSync(debugPath);

  if (process.env.MW_GEN_LOCAL) {
    consola.info('Using local project:');
    consola.info(debugPath);
  }

  return debugPath;
};

export const useDebuggerGenerator = (cli: CAC) => {
  cli
    .command('debug [name]', 'Generate launch.json for VS Code debug', {
      allowUnknownOptions: true,
    })
    .alias('d')
    .option('--port [port]', 'Debugger port', {
      default: 7001,
    })

    .option('--dry-run [dryRun]', 'Dry run to see what is happening')
    .action(async (name, options) => {
      if (options.dryRun) {
        consola.success('Executing in `dry run` mode, nothing will happen.');
      }

      if (!name) {
        name = await inputPromptStringValue(
          'debug configuration name',
          'Midway Local'
        );
      }

      const generatedPath = getDebugGenPath();

      consola.info(
        `Debug config path will be created in ${chalk.green(generatedPath)}`
      );

      const prevExist = fs.existsSync(generatedPath);

      // use midway built-in api to get correct workspace path
      let prevContent: any = {};

      try {
        prevContent = jsonfile.readFileSync(generatedPath);
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
        !prevContent.configuration.length
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

      if (!options.dryRun) {
        fs.writeFileSync(
          generatedPath,
          prettier.format(JSON.stringify(writeContent), { parser: 'json' })
        );
      }
    });
};
