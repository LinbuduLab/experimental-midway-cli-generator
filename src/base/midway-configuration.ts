import path from 'path';
import { Configuration, App } from '@midwayjs/decorator';
import {
  ILifeCycle,
  IMidwayContainer,
  IMidwayApplication,
} from '@midwayjs/core';
import { IMidwayKoaApplication } from '@midwayjs/koa';
import { getConnection } from 'typeorm';
import * as orm from '@midwayjs/orm';

@Configuration({
  imports: [],
  importConfigs: ['./config'],
})
@Ctx({})
export class ContainerConfiguration implements ILifeCycle {
  @App()
  app: IMidwayKoaApplication;

  async onReady(): Promise<void> {
    const connection = getConnection();
    console.log(`[ TypeORM ] connection [${connection.name}] established`);

    console.log('[ TypeORM ] Mock Data Inserted');
  }
}
