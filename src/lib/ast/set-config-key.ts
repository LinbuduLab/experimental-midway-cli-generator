import {
  ArrowFunction,
  SourceFile,
  SyntaxKind,
  VariableDeclarationKind,
  ts,
} from 'ts-morph';
import path from 'path';
import fs from 'fs-extra';
import prettier from 'prettier';
import strip from 'strip-comments';
import flatten from 'lodash/flatten';

// 仅适用于默认导出方法形式
export function addConfigKey(source: SourceFile, key: string, value: any) {
  // 获取默认导出的箭头函数
  // TODO: 直接获取默认导出
  const arrowFunc = source
    .getExportedDeclarations()
    .get('default')[0]
    .asKind(SyntaxKind.ArrowFunction);

  // 获取箭头函数内部的导出

  // 返回值语句
  const returnStatement = arrowFunc.getStatement(
    s => s.getKind() === SyntaxKind.ReturnStatement
  );

  const stripedReturnStatement = strip(returnStatement.getText());

  const returnStatementIdx = returnStatement.getChildIndex();

  arrowFunc.removeStatement(returnStatementIdx);

  const configVarIdentifier = arrowFunc
    .getBody()
    // const config = {} as DefaultConfig;
    .getFirstChildByKind(SyntaxKind.VariableStatement)
    .getFirstChildByKind(SyntaxKind.VariableDeclarationList)
    .getFirstChildByKind(SyntaxKind.SyntaxList)
    //  [ 'Identifier', 'EqualsToken', 'AsExpression' ]
    .getFirstChildByKind(SyntaxKind.VariableDeclaration)
    .getFirstChildByKind(SyntaxKind.Identifier)
    .getText();

  const existPropAssignmentKeys = arrowFunc
    .getBody()
    .getFirstChildByKind(SyntaxKind.SyntaxList)
    .getChildrenOfKind(SyntaxKind.ExpressionStatement)
    .map(child => {
      const propsAssignTokens = child
        // a.b = x
        .getFirstChildByKind(SyntaxKind.BinaryExpression)
        // a.b
        .getFirstChildByKind(SyntaxKind.PropertyAccessExpression);
      return propsAssignTokens;
    })
    .map(prop => {
      // [ 'Identifier', 'DotToken', 'Identifier' ]
      const children = prop.getChildren();
      if (
        children.length === 3 &&
        children[1].getKind() === SyntaxKind.DotToken
      ) {
        return children[2].getText();
      }
    });

  if (existPropAssignmentKeys.includes(key)) {
    console.error(`Key ${key} exist !`);
    process.exit(0);
  }

  // FIXME:
  arrowFunc.addStatements(
    `${configVarIdentifier}.${key} = ${JSON.stringify(value)}`
  );

  // arrowFunc.addStatements(stripedReturnStatement);

  // source.saveSync();

  // const absWritePath = source.getFilePath();

  // const formatted = prettier.format(
  //   fs.readFileSync(absWritePath, { encoding: 'utf8' }),
  //   {
  //     parser: 'typescript',
  //   }
  // );

  // fs.writeFileSync(absWritePath, formatted);
}
