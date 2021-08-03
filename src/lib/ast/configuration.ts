import {
  ArrowFunction,
  Project,
  SourceFile,
  SyntaxKind,
  VariableDeclarationKind,
  DecoratorStructure,
} from 'ts-morph';
import path from 'path';
import fs from 'fs-extra';
import strip from 'strip-comments';
// update @Configuration
// add onReady / onStop
// add this.app.use to onReady
// add console.log to onReady

// FIXME:
export function getExistClassMethods(source: SourceFile, className: string) {
  return source
    .getFirstChildByKind(SyntaxKind.SyntaxList)
    .getFirstChildByKind(SyntaxKind.ClassDeclaration)
    .getChildAtIndexIfKind(6, SyntaxKind.SyntaxList)
    .getChildren()
    .map(child => {
      if (child.getKind() === SyntaxKind.MethodDeclaration) {
        return child.getFirstChildByKind(SyntaxKind.Identifier).getText();
      }
    })
    .filter(Boolean);
}

// FIXME: find by name instead of index
export function getLifeCycleClassMethods(
  source: SourceFile
): LifeCycleMethod[] {
  return source
    .getFirstChildByKind(SyntaxKind.SyntaxList)
    .getFirstChildByKind(SyntaxKind.ClassDeclaration)
    .getChildAtIndexIfKind(6, SyntaxKind.SyntaxList)
    .getChildren()
    .map(child => {
      if (child.getKind() === SyntaxKind.MethodDeclaration) {
        return child
          .getFirstChildByKind(SyntaxKind.Identifier)
          .getText() as LifeCycleMethod;
      }
    })
    .filter(Boolean);
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
// export function addClassMethods(source: SourceFile, method: string) {

// }

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

export function updateFunctionBody() {}

export function updateFunctionArgs() {}

// move to util
export function addConsoleStatement() {}
