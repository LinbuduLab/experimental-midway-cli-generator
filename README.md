# experimental-midway-cli-generator

Experimental works for Midway-CLI generator (fragments / components)

## Tmp-Use

本地使用 根目录下的`project`文件夹验证效果（基于环境变量控制）

较稳定的 generator：

```bash
yarn dev c
yarn dev c user
yarn dev m mw --framework=koa

yarn dev d

yarn dev sls faas ff --oss --event
yarn dev sls aggr ag --dry-run

yarn dev orm setup
yarn dev orm entity user
yarn dev orm subscriber user --dry-run

yarn dev gql object

yarn dev axios
yarn dev oss
yarn dev swagger
```

## Future

- Virtual-File based dryRun mode(`--dry-run`).
- JSON Schema based schematics customization(like `Angular`).
- Codemod enhancement(use chain syntax to execute / customize codemod quickly).
