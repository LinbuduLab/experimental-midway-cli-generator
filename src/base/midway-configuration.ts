@Configuration({
  imports: [orm, orm, orm],
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
