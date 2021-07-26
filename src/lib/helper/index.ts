import * as inquirer from 'inquirer';
import { capitalCase } from '../case/capital-case';
import { dotCase } from '../case/dot-case';
import { lowerCase } from '../case/lower-case';
import { constantCase } from '../case/constant-case';

// true -> true
// "true" -> true
// "false" -> false
// false -> false
export const ensureBooleanType = (value: boolean | string) => {
  return value === true || value === 'true';
};

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
