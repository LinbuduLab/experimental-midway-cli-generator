# experimental-midway-cli-generator

Experimental works for Midway-CLI generator (fragments / components)

- negated option

## Serverless

- [ ] Functions
- [ ] Aggr functions

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
