# experimental-midway-cli-generator

Experimental works for Midway-CLI generator (fragments / components)

- negated option

## Fragments

- Controller
  - Light / Full template
  - Spec
- Service
  - Spec
- Middleware
  - Framework
  - Third lib / internal implementation
- Test
  - Application

## Components

- TypeORM
  - Setup
  - Entity
    - Relation
  - Configuration
  - Service
  - Query Builder
- TypeGraphQL
  - Setup
  - ObjectType / InputType / InterfaceType
  - Resolver / FieldResolver
  - Scalar / Enum / Union / Directives / Extensions
  - Middleware
  - TSConfig modification
  - Comments
- Prisma
  - Setup
  - Commands scripts
  - GitIgnore modification
  - Comments
- Cache
- Swagger

## Future

- Virtual-File based dryRun mode(`--dry-run`).
- JSON Schema based schematics customization(like `Angular`).
- Codemod enhancement(use chain syntax to execute / customize codemod quickly).
