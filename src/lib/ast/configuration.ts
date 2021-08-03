import {
  ArrowFunction,
  Project,
  SourceFile,
  SyntaxKind,
  VariableDeclarationKind,
  DecoratorStructure,
} from 'ts-morph';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as strip from 'strip-comments';
import { map } from 'lodash';

// update @Configuration
// add onReady / onStop
// add this.app.use to onReady
// add console.log to onReady

export function getExistClassMethods(source: SourceFile) {
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

export function updateDecoratorArgs() {}

export function addClassMethod() {}

export function updateFunctionBody() {}

export function updateFunctionArgs() {}

// move to util
export function addConsoleStatement() {}
