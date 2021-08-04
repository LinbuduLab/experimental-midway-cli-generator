import execa from 'execa';
import jsonfile from 'jsonfile';
import prettier from 'prettier';
import path from 'path';
import fs from 'fs-extra';
import findUp from 'find-up';
import consola from 'consola';

export const getNearestPackageFile = (cwd?: string) => {
  return findUp.sync('package.json', {
    type: 'file',
    cwd,
  });
};

export type DepRecord = Record<
  'dependencies' | 'devDependencies',
  Record<string, string>
>;

export const checkDepExist = (dep: string) => {
  const pkg: DepRecord = JSON.parse(
    fs.readFileSync(getNearestPackageFile(), 'utf-8')
  );
  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };

  return Object.keys(allDeps).includes(dep);
};

export const installDep = async (dep: string, asDevDeps = false) => {
  const manager = getManager();
  const command = `${manager} ${
    manager === 'yarn' ? 'add' : 'install'
  } ${dep} ${asDevDeps ? '--save-dev' : '--save'}`;
  execa.sync(command, {
    stdio: 'inherit',
    preferLocal: true,
    shell: true,
  });
};

type PkgManager = 'npm' | 'yarn';

export const getManager = (cwd?: string): PkgManager => {
  return findUp.sync('yarn.lock', {
    type: 'file',
    cwd,
  })
    ? 'yarn'
    : 'npm';
};
