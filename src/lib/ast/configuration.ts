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
  PropertyDeclaration,
} from 'ts-morph';
import path from 'path';
import fs from 'fs-extra';
import strip from 'strip-comments';
import { addNamedImportsMember } from './import';

// update @Configuration
// add onReady / onStop
// add this.app.use to onReady
// add console.log to onReady

export function getExistClassMethodsDeclaration(
  source: SourceFile,
  className: string
): MethodDeclaration[];

export function getExistClassMethodsDeclaration(
  source: SourceFile,
  className: string,
  methodName: string
): MethodDeclaration;

// 获得类的方法声明
export function getExistClassMethodsDeclaration(
  source: SourceFile,
  className: string,
  methodName?: string
) {
  const classDeclarations = source
    .getFirstChildByKind(SyntaxKind.SyntaxList)
    .getChildrenOfKind(SyntaxKind.ClassDeclaration);

  const targetClass = classDeclarations.filter(
    classDecs =>
      classDecs.getFirstChildByKind(SyntaxKind.Identifier).getText() ===
      className
  );

  if (!targetClass.length) {
    return;
  }

  const targetClassItem = targetClass[0];

  const methods = targetClassItem.getMethods();

  if (methodName) {
    return methods.filter(
      m => m.getFirstChildByKind(SyntaxKind.Identifier).getText() === methodName
    )[0];
  } else {
    return methods;
  }
}

// 获取类的方法名称
export function getExistClassMethods(source: SourceFile, className: string) {
  return getExistClassMethodsDeclaration(source, className).map(m =>
    m.getFirstChildByKind(SyntaxKind.Identifier).getText()
  );
}

export function getExistClassPropDeclarations(
  source: SourceFile,
  className: string
): PropertyDeclaration[];

export function getExistClassPropDeclarations(
  source: SourceFile,
  className: string,
  propName: string
): PropertyDeclaration[];

// 获取类的属性声明
export function getExistClassPropDeclarations(
  source: SourceFile,
  className: string,
  propName?: string
): PropertyDeclaration | PropertyDeclaration[] {
  const classDeclarations = source
    .getFirstChildByKind(SyntaxKind.SyntaxList)
    .getChildrenOfKind(SyntaxKind.ClassDeclaration);

  const targetClass = classDeclarations.filter(
    classDecs =>
      classDecs.getFirstChildByKind(SyntaxKind.Identifier).getText() ===
      className
  );

  if (!targetClass.length) {
    return;
  }

  const targetClassItem = targetClass[0];

  const props = targetClassItem.getProperties();

  if (propName) {
    return props.filter(
      m => m.getFirstChildByKind(SyntaxKind.Identifier).getText() === propName
    )[0];
  } else {
    return props;
  }
}

// 获取类的属性名称
export function getExistClassProps(source: SourceFile, className: string) {
  return getExistClassPropDeclarations(source, className).map(m =>
    m.getFirstChildByKind(SyntaxKind.Identifier).getText()
  );
}

// 获取生命周期类已有的方法
export function getLifeCycleClassMethods(
  source: SourceFile
): LifeCycleMethod[] {
  return getExistClassMethods(
    source,
    'ContainerConfiguration'
  ) as LifeCycleMethod[];
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

  const decoratorArg = correspondingDecorator
    .getArguments()[0]
    .asKind(SyntaxKind.ObjectLiteralExpression);

  const currentArgObjectKeys = decoratorArg
    .getFirstChildByKind(SyntaxKind.SyntaxList)
    .getChildrenOfKind(SyntaxKind.PropertyAssignment)
    .map(assign => assign.getFirstChildByKind(SyntaxKind.Identifier).getText());

  if (currentArgObjectKeys.includes(argKey)) {
    // 参数已存在 合并
    // imports: [orm]
    // add args by addChildText
    const propAssignments = decoratorArg
      .getFirstChildByKind(SyntaxKind.SyntaxList)
      .getChildrenOfKind(SyntaxKind.PropertyAssignment)
      .find(
        assign =>
          assign.getChildrenOfKind(SyntaxKind.Identifier)[0].getText() ===
          argKey
      );

    // orm
    const existPropAssignedValue = propAssignments
      .getFirstChildByKindOrThrow(SyntaxKind.ArrayLiteralExpression)
      .getFirstChildByKind(SyntaxKind.SyntaxList);

    existPropAssignedValue.getText()
      ? existPropAssignedValue.addChildText(`, ${identifier}`)
      : existPropAssignedValue.addChildText(identifier);

    // const existPropAssign = decoratorArg
    //   .getProperty(argKey)
    //   .getFirstChildByKind(SyntaxKind.ArrayLiteralExpression)
    //   .getFirstChildByKind(SyntaxKind.SyntaxList);

    // const existPropAssignValue = existPropAssign.getFirstChildByKind(
    //   SyntaxKind.Identifier
    // );

    // const val: string[] = [];

    // if (!existPropAssignValue) {
    //   val.push(identifier);
    // } else {
    //   val.push(String(existPropAssignValue.getText()), `, ${identifier}`);
    // }
  } else {
    decoratorArg.insertPropertyAssignment(0, {
      name: argKey,
      initializer: `[${identifier}]`,
    });
  }

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
    addNamedImportsMember(source, '@midwayjs/core', [
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
    addNamedImportsMember(source, '@midwayjs/core', ['IMidwayApplication']);
  }

  addNamedImportsMember(source, '@midwayjs/decorator', [decorators]);

  addClassProperty(
    source,
    'ContainerConfiguration',
    propKey,
    [decorators],
    propType
  );

  source.saveSync();
}
