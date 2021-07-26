#!/usr/bin/env node
import cac from 'cac';
import { injectControllerGenerator } from './controller';
import { injectServiceGenerator } from './service';
import { injectMiddlewareGenerator } from './middleware';
import { injectDebuggerGenerator } from './debug';

const cli = cac();

injectControllerGenerator(cli);
injectServiceGenerator(cli);
injectMiddlewareGenerator(cli);
injectDebuggerGenerator(cli);

const parsed = cli.parse();

// console.log(JSON.stringify(parsed, null, 2));
