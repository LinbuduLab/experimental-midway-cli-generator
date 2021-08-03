import {
  ArrowFunction,
  Project,
  SourceFile,
  SyntaxKind,
  VariableDeclarationKind,
  DecoratorStructure,
  ClassDeclaration,
  StructureKind,
  MethodDeclaration,
} from 'ts-morph';
import path from 'path';
import fs from 'fs-extra';
import strip from 'strip-comments';

// update @Configuration
// add onReady / onStop
// add this.app.use to onReady
// add console.log to onReady

// TODO: get methods / get methods declarations

// FIXME:
export function getExistClassMethods(source: SourceFile, className: string) {
  const classDeclarations = source
    .getFirstChildByKind(SyntaxKind.SyntaxList)
    .getChildrenOfKind(SyntaxKind.ClassDeclaration);

  const correspondingClass = classDeclarations.filter(
    classDecs =>
      classDecs.getFirstChildByKind(SyntaxKind.Identifier).getText() ===
      className
  );

  if (!correspondingClass.length) {
    return;
  }

  const correspondingClassItem = correspondingClass[0];

  const methods = correspondingClassItem
    .getMethods()
    .map(m => m.getFirstChildByKind(SyntaxKind.Identifier).getText());

  return methods;
}

export function getExistClassMethodsDeclaration(
  source: SourceFile,
  className: string
): MethodDeclaration[];

export function getExistClassMethodsDeclaration(
  source: SourceFile,
  className: string,
  methodName?: string
): MethodDeclaration;

export function getExistClassMethodsDeclaration(
  source: SourceFile,
  className: string,
  methodName?: string
) {
  const classDeclarations = source
    .getFirstChildByKind(SyntaxKind.SyntaxList)
    .getChildrenOfKind(SyntaxKind.ClassDeclaration);

  const correspondingClass = classDeclarations.filter(
    classDecs =>
      classDecs.getFirstChildByKind(SyntaxKind.Identifier).getText() ===
      className
  );

  if (!correspondingClass.length) {
    return;
  }

  const correspondingClassItem = correspondingClass[0];

  const methods = correspondingClassItem.getMethods();
  // .map(m => m.getFirstChildByKind(SyntaxKind.Identifier).getText());

  if (methodName) {
    return methods.filter(
      m => m.getFirstChildByKind(SyntaxKind.Identifier).getText() === methodName
    )[0];
  } else {
    return methods;
  }
}

export function getExistClassProps(source: SourceFile, className: string) {
  const classDeclarations = source
    .getFirstChildByKind(SyntaxKind.SyntaxList)
    .getChildrenOfKind(SyntaxKind.ClassDeclaration);

  const correspondingClass = classDeclarations.filter(
    classDecs =>
      classDecs.getFirstChildByKind(SyntaxKind.Identifier).getText() ===
      className
  );

  if (!correspondingClass.length) {
    return;
  }

  const correspondingClassItem = correspondingClass[0];

  const props = correspondingClassItem
    .getProperties()
    .map(m => m.getFirstChildByKind(SyntaxKind.Identifier).getText());

  return props;
}

export function getLifeCycleClassMethods(
  source: SourceFile
): LifeCycleMethod[] {
  return getExistClassMethods(
    source,
    'ContainerConfiguration'
  ) as LifeCycleMethod[];
}

export function tmp(source: SourceFile) {
  const tmp1 = source
    .getExportedDeclarations()
    .get('ContainerLifeCycle')[0]
    .asKind(SyntaxKind.ClassDeclaration);

  const tmp2 = tmp1.getDecorator('Configuration');

  // const tmp3 = tmp2.addArgument(writer => writer.write('{}'));

  const tmp3 = tmp2

    .getArguments()[0]
    .asKind(SyntaxKind.ObjectLiteralExpression);

  console.log('tmp3: ', tmp3.getText());

  // const tmp4 = tmp3.getChildren().map(x => x.getKindName());
  // console.log('tmp4: ', tmp4);

  // const tmp5 = tmp3.getChildAtIndexIfKind(1, SyntaxKind.SyntaxList);
}

// 暂时只支持@Deco({  })
export function updateDecoratorArrayArgs(
  source: SourceFile,
  decoratorName: string,
  argKey: string,
  identifier: string
) {
  const decoratorSyntaxList = source
    .getFirstChildByKind(SyntaxKind.SyntaxList)
    .getFirstChildByKind(SyntaxKind.ClassDeclaration)
    .getFirstChildByKind(SyntaxKind.SyntaxList);

  const correspondingDecorator = decoratorSyntaxList
    .getChildren()
    // .map(x => x.getKindName());
    .filter(child => {
      if (child.getKind() !== SyntaxKind.Decorator) {
        return false;
      } else {
        return (
          child
            .getFirstChildByKind(SyntaxKind.CallExpression)
            .getFirstChildByKind(SyntaxKind.Identifier)
            .getText() === decoratorName
        );
      }
    })[0]
    .asKind(SyntaxKind.Decorator);

  // FIXME: length

  // console.log(correspondingDecorator.getText());

  // TODO: 查看是否已经有imports importConfigs

  // 对于数组：push
  // TODO: 对于对象：merge
  // TODO: 对于原始值：replace

  const currentArgObjectKeys = correspondingDecorator.getArguments().map(x => {
    const propAssignments = x
      .getFirstChildByKind(SyntaxKind.SyntaxList)
      .getChildren()
      .filter(x => x.getKind() === SyntaxKind.PropertyAssignment);

    const propKeys = propAssignments.map(assign =>
      assign.getFirstChildByKind(SyntaxKind.Identifier).getText()
    );

    const propPairs = propAssignments.map(assign => ({
      key: assign.getFirstChildByKind(SyntaxKind.Identifier).getText(),
      value: assign.getLastChild().getText(),
    }));
  });

  const configObjNode = correspondingDecorator.getArguments()[0];

  const propAssignments = configObjNode
    .getFirstChildByKind(SyntaxKind.SyntaxList)
    .getChildrenOfKind(SyntaxKind.PropertyAssignment)
    .filter(
      assign =>
        assign.getChildrenOfKind(SyntaxKind.Identifier)[0].getText() === argKey
    )
    .filter(Boolean)[0];

  const existPropValue = propAssignments
    // [ SyntaxList ]
    .getFirstChildByKind(SyntaxKind.ArrayLiteralExpression)
    //
    .getFirstChildByKind(SyntaxKind.SyntaxList);

  existPropValue.getText()
    ? existPropValue.addChildText(`, ${identifier}`)
    : existPropValue.addChildText(identifier);

  source.saveSync();
}

export function addNamedImports(
  source: SourceFile,
  importSpec: string,
  members: string[]
): void {
  const importDec = source

    .getFirstChildByKind(SyntaxKind.SyntaxList)
    .getChildrenOfKind(SyntaxKind.ImportDeclaration)
    .filter(importDec => {
      const importString = importDec
        .getFirstChildByKind(SyntaxKind.StringLiteral)
        .getText();
      return `'${importSpec}'` === importString;
    })[0];

  if (!importDec) {
    source.addImportDeclaration({
      moduleSpecifier: importSpec,
      namedImports: members,
    });
    source.saveSync();

    return;
  }

  const importClause = importDec.getImportClause();
  const namedImports = importClause.getNamedImports().map(x => x.getText());

  const namedImportsCanBeAdded = members.filter(
    mem => !namedImports.includes(mem)
  );

  if (!namedImportsCanBeAdded.length) {
    return;
  }

  importDec.addNamedImports(namedImportsCanBeAdded);

  source.saveSync();
}

// 暂时只支持为 onReady onStop 添加return type
// container: IMidwayContainer, app?: IMidwayApplication
// addAsync?
export function addPlainClassMethods(
  source: SourceFile,
  className: string,
  methods: string[]
) {
  const existClassMethods: string[] = getExistClassMethods(source, className);
  const methodsCanBeAdded = methods.filter(
    method => !existClassMethods.includes(method)
  );
  if (!methodsCanBeAdded.length) {
    return;
  }
  const classDec = source
    .getFirstChildByKind(SyntaxKind.SyntaxList)
    .getFirstChildByKind(SyntaxKind.ClassDeclaration);

  if (!classDec) {
    return;
  }

  methodsCanBeAdded.forEach(m => {
    classDec.addMethod({
      name: m,
      // hasQuestionToken: true,
      isAsync: false,
      parameters: [],
      returnType: 'void',
      statements: 'console.log("Method Added By Midway Code Mod")',
      typeParameters: [],
    });
  });

  source.saveSync();
}

type LifeCycleMethod = 'onReady' | 'onStop';

const LIFE_CYCLE_METHODS: LifeCycleMethod[] = ['onReady', 'onStop'];

export function addLifeCycleMethods(
  source: SourceFile,
  methods: LifeCycleMethod[]
) {
  const existClassMethods: LifeCycleMethod[] = getLifeCycleClassMethods(source);

  const lifeCycleMethodsCanBeAdded = methods.filter(
    method =>
      LIFE_CYCLE_METHODS.includes(method) && !existClassMethods.includes(method)
  );

  if (!lifeCycleMethodsCanBeAdded.length) {
    return;
  } else {
    addNamedImports(source, '@midwayjs/core', [
      'IMidwayContainer',
      'IMidwayApplication',
    ]);
  }

  const lifeCycleClass = source
    .getFirstChildByKind(SyntaxKind.SyntaxList)
    .getFirstChildByKind(SyntaxKind.ClassDeclaration);

  lifeCycleMethodsCanBeAdded.forEach(m => {
    lifeCycleClass.addMethod({
      name: m,
      // hasQuestionToken: true,
      isAsync: true,
      parameters: [
        {
          name: 'container',
          type: 'IMidwayContainer',
          hasQuestionToken: false,
          initializer: null,
          isReadonly: false,
          isRestParameter: false,
        },
        {
          name: 'app',
          type: 'IMidwayApplication',
          hasQuestionToken: true,
          initializer: null,
          isReadonly: false,
          isRestParameter: false,
        },
      ],
      returnType: 'Promise <void>',
      statements: '',
      typeParameters: [],
    });
  });

  source.saveSync();
}

export function ensureLifeCycleMethodArguments(
  source: SourceFile,
  methods: LifeCycleMethod[]
) {
  const existMethodDeclarations = getExistClassMethodsDeclaration(
    source,
    'ContainerConfiguration'
  );

  const shouldBeUpdated: MethodDeclaration[] = [];

  existMethodDeclarations.forEach((m, idx) => {
    if (m.getFirstChildByKind(SyntaxKind.SyntaxList).getText() !== 'async') {
      return;
    }

    const argsSyntaxList = m.getChildrenOfKind(SyntaxKind.SyntaxList)[1];

    // 参数为空：直接补全
    if (!argsSyntaxList) {
      return;
    }

    const paramSyntaxList = argsSyntaxList.getChildrenOfKind(
      SyntaxKind.Parameter
    );

    // 参数数量不正确 要求用户补全
    if (paramSyntaxList.length !== 2) {
      return;
    }

    // argsSyntaxList.forEach(a => {
    //   if(){}
    // });
  });

  // const argsNotPreparedMethod = existMethodDeclarations
  // console.log(
  //   existMethodDeclarations[0]
  //     .getChildrenOfKind(SyntaxKind.SyntaxList)[1]
  //     .getFirstChildByKind(SyntaxKind.Parameter)
  //     .getChildren()
  //     .map(x => x.getKindName())
  // );

  // console.log(existMethodDeclarations[0].getText());
}

export function addClassProperty(
  source: SourceFile,
  className: string,
  propKey: string,
  decorators?: string[],
  propType?: string
) {
  const existClassProps = getExistClassProps(source, className);

  if (existClassProps.includes(propKey)) {
    return;
  }
  const classDec = source
    .getFirstChildByKind(SyntaxKind.SyntaxList)
    .getFirstChildByKind(SyntaxKind.ClassDeclaration);

  if (!classDec) {
    return;
  }

  const applyDecorators: Array<DecoratorStructure> = decorators.map(
    decorator => ({
      name: decorator,
      kind: StructureKind.Decorator,
      arguments: [],
    })
  );

  classDec.addProperty({
    name: propKey,
    decorators: applyDecorators,
    type: propType,
  });

  // FIXME: empty line

  source.saveSync();
}

type MidwayPropDecorators = 'Inject' | 'App';

export function addClassPropertyWithMidwayDecorator(
  source: SourceFile,
  propKey: string,
  decorators: MidwayPropDecorators
) {
  const propType = decorators === 'App' ? 'IMidwayApplication' : 'unknown';

  if (propType === 'IMidwayApplication') {
    addNamedImports(source, '@midwayjs/core', ['IMidwayApplication']);
  }

  addNamedImports(source, '@midwayjs/decorator', [decorators]);

  addClassProperty(
    source,
    'ContainerConfiguration',
    propKey,
    [decorators],
    propType
  );

  source.saveSync();
}

export function updateFunctionBody() {}

export function updateFunctionArgs() {}

// move to util
export function addConsoleStatement() {}
