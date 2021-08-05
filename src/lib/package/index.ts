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

export type ScriptRecord = Record<string, string>;

export type NPMScriptMap = {
  script: string;
  content: string;
};

export const addNPMScripts = (pkgPath: string, scriptMap: NPMScriptMap[]) => {
  let existScriptMap: ScriptRecord = {};
  let originContentObj: Record<string, any> = {};
  const originContent = fs.readFileSync(pkgPath, 'utf-8');

  try {
    originContentObj = JSON.parse(originContent);
    existScriptMap = originContentObj['scripts'];
  } catch (error) {
    existScriptMap = {};
  }

  const existScriptKeys = Object.keys(existScriptMap);

  const validScripts = scriptMap
    // .map(script => script.script)
    .filter(script => !existScriptKeys.includes(script.script));

  const validScriptObject: ScriptRecord = {};

  for (const scriptKey of validScripts) {
    validScriptObject[scriptKey.script] = scriptKey.content;
  }

  const updatedScriptMap = {
    ...existScriptMap,
    ...validScriptObject,
  };

  originContentObj['scripts'] = updatedScriptMap;

  fs.writeFileSync(
    pkgPath,
    prettier.format(JSON.stringify(originContentObj), { parser: 'json' })
  );
};

export const checkDepExist = (dep: string, cwd = process.cwd()) => {
  const pkg: DepRecord = JSON.parse(
    fs.readFileSync(getNearestPackageFile(cwd), 'utf-8')
  );
  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };

  return Object.keys(allDeps).includes(dep);
};

export const installDep = async (
  dep: string,
  asDevDeps = false,
  cwd = process.cwd()
) => {
  const manager = getManager();
  const command = `${manager} ${
    manager === 'yarn' ? 'add' : 'install'
  } ${dep} ${asDevDeps ? '--save-dev' : '--save'}`;
  execa.sync(command, {
    stdio: 'inherit',
    preferLocal: true,
    shell: true,
    cwd,
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
