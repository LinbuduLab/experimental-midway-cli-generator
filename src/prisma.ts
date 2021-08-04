import { CAC } from 'cac';
import path from 'path';
import fs from 'fs-extra';
import prettier from 'prettier';
import execa from 'execa';
import consola from 'consola';
import { readPackageSync } from './lib/helper';
import { addNPMScripts } from './lib/package';

// TODO: modify official generated to use SQLite3

// 执行prisma init
// 新增npm scripts

export const usePrismaGenerator = (cli: CAC) => {
  cli
    .command('prisma', 'Generate controller', {
      allowUnknownOptions: true,
    })
    .option('--dry-run [dryRun]', 'Dry run to see what is happening')
    .action(async options => {
      console.log(consola.info('Executing `prisma init`'));
      const pkg = readPackageSync({ cwd: process.cwd() });

      // if (
      //   !Object.keys(pkg.dependencies).includes('@prisma/client') ||
      //   Object.keys(pkg.devDependencies).includes('prisma')
      // ) {
      //   consola.error(
      //     'Make sure you have `@prisma/client` installed as `dependencies`, and `prisma` as `devDependencies`'
      //   );
      //   process.exit(0);
      // }

      const cwd = process.env.GEN_LOCAL
        ? path.resolve(__dirname, '../project')
        : process.cwd();

      const pkgPath = path.resolve(cwd, 'package.json');

      execa.sync('prisma init', {
        cwd,
        stdio: 'inherit',
        preferLocal: true,
        shell: true,
      });

      addNPMScripts(pkgPath, [
        {
          script: 'prisma:gen',
          content: 'prisma generate',
        },
        {
          script: 'prisma:push',
          content: 'prisma db push',
        },
        {
          script: 'prisma:pull',
          content: 'prisma db pull',
        },
        {
          script: 'prisma:migrate',
          content: 'prisma migrate --preview-feature',
        },
      ]);
    });
};
