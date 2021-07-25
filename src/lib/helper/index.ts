import * as inquirer from 'inquirer';

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
