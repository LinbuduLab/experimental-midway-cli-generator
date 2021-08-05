# experimental-midway-cli-generator

Experimental works for Midway-CLI generator (fragments / components)

## Tmp-Use

本地使用 根目录下的`project`文件夹验证效果（基于环境变量控制）

较稳定的 generator：

```bash
yarn dev c
yarn dev c user


yarn dev orm setup
yarn dev orm entity user
yarn dev orm subscriber user --dry-run



```

## Serverless

- [x] Functions
- [x] Aggr functions

## Fragments

- Controller
  - [x] Light / Full template
  - [ ] Spec
- Service
  - [ ] Spec
- Middleware
  - [x] Framework
  - [x] Third lib / internal implementation
- Test
  - Application

## Components

- [ ] TypeORM
  - [ ] Setup
  - [x] Entity
    - [x] Relation
  - [ ] Configuration
  - [x] Subscriber
- [ ] TypeGraphQL
  - [ ] Setup
  - [x] ObjectType / InputType / InterfaceType
  - [x] Resolver / FieldResolver
  - [ ] Scalar / Enum / Union / Directives / Extensions
  - [x] Middleware
  - [ ] TSConfig modification
- [ ] Prisma
  - [ ] Setup
  - [ ] Commands scripts
  - [ ] GitIgnore modification
  - [ ] Comments
- [ ] Cache
- [ ] Swagger

## Future

- Virtual-File based dryRun mode(`--dry-run`).
- JSON Schema based schematics customization(like `Angular`).
- Codemod enhancement(use chain syntax to execute / customize codemod quickly).
