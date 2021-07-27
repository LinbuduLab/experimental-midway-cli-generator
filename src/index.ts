#!/usr/bin/env node
import cac from 'cac';
import { injectControllerGenerator } from './controller';
import { injectServiceGenerator } from './service';
import { injectMiddlewareGenerator } from './middleware';
import { injectDebuggerGenerator } from './debug';

import { injectTypeORMGenerator } from './typeorm';

const cli = cac();

injectControllerGenerator(cli);
injectServiceGenerator(cli);
injectMiddlewareGenerator(cli);
injectDebuggerGenerator(cli);

injectTypeORMGenerator(cli);

const parsed = cli.parse();

// console.log(JSON.stringify(parsed, null, 2));
