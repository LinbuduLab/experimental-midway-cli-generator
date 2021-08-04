import * as inquirer from 'inquirer';
import { capitalCase } from '../case/capital-case';
import { dotCase } from '../case/dot-case';
import { lowerCase } from '../case/lower-case';
import { constantCase } from '../case/constant-case';
import * as findUp from 'find-up';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as minIndent from 'min-indent';
import prettier from 'prettier';

import parseJson from 'parse-json';
import normalizePackageData from 'normalize-package-data';

export function formatTSFile(filePath: string) {
  const origin = fs.readFileSync(filePath, 'utf-8');
  const formatted = prettier.format(origin, { parser: 'typescript' });
  fs.writeFileSync(filePath, formatted);
}

export function readPackageSync({
  cwd = process.cwd(),
  normalize = true,
} = {}) {
  const filePath = path.resolve(cwd, 'package.json');
  const json = parseJson(fs.readFileSync(filePath, 'utf8'));

  if (normalize) {
    normalizePackageData(json);
  }

  return json;
}

// true -> true
// "true" -> true
// "false" -> false
// false -> false
export const ensureBooleanType = (value: boolean | string) => {
  return value === true || value === 'true';
};

export function stripIndent(string: string) {
  const indent = minIndent(string);

  if (indent === 0) {
    return string;
  }

  const regex = new RegExp(`^[ \\t]{${indent}}`, 'gm');

  return string.replace(regex, '');
}

export const inputPromptStringValue = async (
  identifier: string,
  defaultValue?: string | null
): Promise<string> => {
  const promptedValue = await inquirer.prompt([
    {
      type: 'input',
      name: identifier,
      default: defaultValue ?? null,
    },
  ]);

  return promptedValue[identifier];
};

type Names = Record<
  'className' | 'dotName' | 'fileName' | 'constantName',
  string
>;

// className -> capitalCase
// dotName -> dotCase
// fileName -> lowerCase
// constantName -> constantCase
export const names = (origin: string): Names => ({
  className: capitalCase(origin),
  dotName: dotCase(origin),
  fileName: lowerCase(origin),
  constantName: constantCase(origin),
});

export const updateGitIgnore = (patterns: string[]) => {
  const pathUnderGitControl = findUp.sync(['.git'], {
    type: 'directory',
  });

  const ignoreFilePath = path.resolve(
    path.dirname(pathUnderGitControl),
    '.gitignore'
  );
  console.log('ignoreFilePath: ', ignoreFilePath);

  let originContent = fs.readFileSync(ignoreFilePath, 'utf8');

  patterns.forEach(pattern => {
    if (!originContent.includes(pattern)) {
      originContent = `${originContent}\n
${pattern}`;
    }
  });

  const content = stripIndent(originContent);

  fs.writeFileSync(ignoreFilePath, content);
};
