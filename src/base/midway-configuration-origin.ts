import { App, Configuration } from '@midwayjs/decorator';
import { ILifeCycle, IMidwayApplication } from '@midwayjs/core';
import { Application } from 'egg';
import { join } from 'path';

@Configuration({
  importConfigs: [join(__dirname, './config')],
  conflictCheck: true,
})
export class ContainerConfiguration implements ILifeCycle {
  @App()
  app: Application;

  async onReady() {}
}
