#!/usr/bin/env node

// import {} from 'inquirer';
// import {} from 'commander';
// import {} from 'ora';
// // import yargs from 'yargs';
// import * as yargsParser from 'yargs-parser';

// // mw g controller user

// console.log(yargsParser(process.argv.slice(2)));
import cac from 'cac';
import * as path from 'path';
import * as fs from 'fs-extra';
import { compile as EJSCompile } from 'ejs';

import { capitalCase } from './lib/case/capital-case';
import { dotCase } from './lib/case/dot-case';
import { lowerCase } from './lib/case/lower-case';
import * as prettier from 'prettier';

const cli = cac();

cli
  .command('controller [name]', 'Generate controller', {
    allowUnknownOptions: true,
  })
  .alias('c')
  // generate minimal template file
  .option('--light [light]', 'Generate light template', {
    default: true,
  })
  // use dot name like app.controller.ts
  .option('--dot-name [dotName]', 'Generate light template', {
    default: true,
  })
  .option('--format [format]', 'Generate light template', {
    default: true,
  })
  .option('--override [override]', 'Generate light template', {
    default: true,
  })
  .option('--file-name [fileName]', 'Generate light template')
  .action(async (name, options) => {
    // if !name inquirer.prompt
    // interactive mode
    console.log('name: ', name);
    console.log('options: ', options);

    options.fileName = options.fileName
      ? lowerCase(options.fileName)
      : lowerCase(name);

    const exist = fs.existsSync(
      path.resolve(__dirname, `${options.fileName}.ts`)
    );

    if (exist && !options.override) {
      console.log('exist');
      process.exit(0);
    }

    const tmp = fs.readFileSync(
      path.join(__dirname, './templates/controller.ts.ejs'),
      { encoding: 'utf8' }
    );

    const template = EJSCompile(tmp, {})({ name: capitalCase(name) });
    // console.log('template: ', template);

    const fileName = options.dotName
      ? `${dotCase(name)}.controller`
      : lowerCase(name);

    const outputContent = options.format
      ? prettier.format(template, { parser: 'typescript' })
      : template;

    fs.writeFileSync(path.resolve(__dirname, `${fileName}.ts`), outputContent);
  });

// cli.version('0.1.0');

cli.parse();

// console.log(JSON.stringify(parsed, null, 2));
