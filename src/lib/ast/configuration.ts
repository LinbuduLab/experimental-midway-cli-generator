import {
  SourceFile,
  SyntaxKind,
  DecoratorStructure,
  StructureKind,
  MethodDeclaration,
  PropertyDeclaration,
} from 'ts-morph';

import { addNamedImportsMember } from './import';
import consola from 'consola';
import {
  getExistClassMethods,
  getExistClassProps,
  getExistClassMethodsDeclaration,
  getClassDecByName,
  ensureClassProperty,
} from './class';
import {
  LifeCycleMethod,
  LIFE_CYCLE_METHODS,
  MidwayPropDecorator,
} from './utils';

// 获取生命周期类已有的方法
export function getLifeCycleClassMethods(
  source: SourceFile
): LifeCycleMethod[] {
  return getExistClassMethods(
    source,
    'ContainerLifeCycle'
  ) as LifeCycleMethod[];
}

// 获取生命周期类已有的属性
export function getLifeCycleClassProps(source: SourceFile): string[] {
  return getExistClassProps(source, 'ContainerLifeCycle');
}

// 获取生命周期类
export function getLifeCycleClass(source: SourceFile) {
  return getClassDecByName(source, 'ContainerLifeCycle');
}

// 确保容器配置类拥有方法
// 如果已经存在一个，那么只有另一个方法会被传入参数（app  container）
// 使用ensureLifeCycleMethodArguments来确保所有方法均具有正确参数
export function ensureLifeCycleMethods(
  source: SourceFile,
  methods: LifeCycleMethod[],
  apply = true
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

  const lifeCycleClass = getLifeCycleClass(source);

  lifeCycleMethodsCanBeAdded.forEach(m => {
    lifeCycleClass.addMethod({
      name: m,
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

  apply && source.saveSync();
}

// 确保容器配置类的方法具有标准参数
export function ensureLifeCycleMethodArguments(
  source: SourceFile,
  methods: LifeCycleMethod[],
  apply = true
) {
  ensureLifeCycleMethods(source, methods);

  const existMethodDeclarations = getExistClassMethodsDeclaration(
    source,
    'ContainerLifeCycle'
  );

  const methodsShouldBeFix: MethodDeclaration[] = [];

  existMethodDeclarations.forEach((m, idx) => {
    if (m.getFirstChildByKind(SyntaxKind.SyntaxList).getText() !== 'async') {
      return;
    }

    const argsSyntaxList = m.getChildrenOfKind(SyntaxKind.SyntaxList)[1];

    // 只处理参数为空的方法
    if (!argsSyntaxList.getText()) {
      methodsShouldBeFix.push(m);
      return;
    }

    // 存在参数
    const paramSyntaxList = argsSyntaxList.getChildrenOfKind(
      SyntaxKind.Parameter
    );

    // 参数数量不正确 需要手动补全 因为case太多了
    if (paramSyntaxList.length !== 2) {
      consola.error(
        `Incorrect arguments count in ${m.getName()}, expect: 2, found: ${
          paramSyntaxList.length
        }`
      );
      return;
    }
  });

  if (!methodsShouldBeFix.length) {
    return;
  }

  // 仅修正无参数的方法
  methodsShouldBeFix.forEach(m => {
    m.addParameters([
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
    ]);
  });

  apply && source.saveSync();
}

// 确保容器配置类拥有属性，且拥有Midway装饰器
export function ensureClassPropertyWithMidwayDecorator(
  source: SourceFile,
  propKey: string,
  decorators: MidwayPropDecorator = 'Inject',
  apply = true
) {
  const propType = decorators === 'App' ? 'IMidwayApplication' : 'unknown';

  if (propType === 'IMidwayApplication') {
    addNamedImportsMember(source, '@midwayjs/core', ['IMidwayApplication']);
  }

  addNamedImportsMember(source, '@midwayjs/decorator', [decorators]);

  ensureClassProperty(
    source,
    'ContainerLifeCycle',
    propKey,
    [decorators],
    propType
  );

  apply && source.saveSync();
}
