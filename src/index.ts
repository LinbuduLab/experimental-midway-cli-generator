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
import * as inquirer from 'inquirer';
import { compile as EJSCompile } from 'ejs';

import { capitalCase } from './lib/case/capital-case';
import { dotCase } from './lib/case/dot-case';
import { lowerCase } from './lib/case/lower-case';
import * as prettier from 'prettier';

import { injectControllerGenerator } from './controller';

const cli = cac();

injectControllerGenerator(cli);

const parsed = cli.parse();

// console.log(JSON.stringify(parsed, null, 2));
