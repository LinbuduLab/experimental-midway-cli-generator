import * as inquirer from 'inquirer';
import { capitalCase } from '../case/capital-case';
import { dotCase } from '../case/dot-case';
import { lowerCase } from '../case/lower-case';
import { constantCase } from '../case/constant-case';

export const ensureBooleanType = (value: boolean | string) => value !== 'false';

export const inputPromptStringValue = async (
  identifier: string
): Promise<string> => {
  const promptedValue = await inquirer.prompt([
    {
      type: 'input',
      name: identifier,
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
