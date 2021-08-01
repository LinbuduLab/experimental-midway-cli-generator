#!/usr/bin/env node
import cac from 'cac';
import { useControllerGenerator } from './controller';
import { useServiceGenerator } from './service';
import { useMiddlewareGenerator } from './middleware';
import { useDebuggerGenerator } from './debug';
import { useServerlessGenerator } from './serverless';

import { useTypeORMGenerator } from './typeorm';
import { useTypeGraphQLGenerator } from './type-graphql';

const cli = cac();

useControllerGenerator(cli);
useServiceGenerator(cli);
useMiddlewareGenerator(cli);
useDebuggerGenerator(cli);
useServerlessGenerator(cli);

useTypeORMGenerator(cli);
useTypeGraphQLGenerator(cli);

const parsed = cli.parse();

// console.log(JSON.stringify(parsed, null, 2));
