export default appInfo => {
  const config = {} as any;

  config.keys = appInfo.name + '_{{keys}}';

  config.orm = {
    type: 'sqlite',
    name: 'default',
    database: 'db.sqlite',
    synchronize: true,
    dropSchema: true,
    logger: 'advanced-console',
    entities: ['../entities/*'],
  };

  config.security = {
    csrf: false,
  };

  return config;
};
