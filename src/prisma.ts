import { CAC } from 'cac';
import path from 'path';
import fs from 'fs-extra';
import prettier from 'prettier';
import execa from 'execa';
import consola from 'consola';
import { readPackageSync } from './lib/helper';

// TODO: modify official generated to use SQLite3

export const usePrismaGenerator = (cli: CAC) => {
  cli
    .command('prisma', 'Generate controller', {
      allowUnknownOptions: true,
    })
    .option('--dry-run [dryRun]', 'Dry run to see what is happening')
    .action(async options => {
      console.log(consola.info('Executing `prisma init`'));
      const pkg = readPackageSync({ cwd: process.cwd() });

      if (
        !Object.keys(pkg.dependencies).includes('@prisma/client') ||
        Object.keys(pkg.devDependencies).includes('prisma')
      ) {
        consola.error(
          'Make sure you have `@prisma/client` installed as `dependencies`, and `prisma` as `devDependencies`'
        );
        process.exit(0);
      }

      execa.sync('prisma init', {
        cwd: process.cwd(),
        stdio: 'pipe',
      });
    });
};
