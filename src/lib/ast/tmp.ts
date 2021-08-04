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
import consola from 'consola';

// export const x = {}
export function addConfigExport(source: SourceFile, key: string, value: any) {}

// config.x = {}
// 仅适用于默认导出方法形式
export function addConfigKey(source: SourceFile, key: string, value: any) {
  const arrowFuncBlock = source
    .getFirstChildByKind(SyntaxKind.SyntaxList)
    .getFirstChildByKind(SyntaxKind.ExportAssignment)
    .getFirstChildByKind(SyntaxKind.ArrowFunction)
    .getFirstChildByKind(SyntaxKind.Block);
  // .getFirstChildByKind(SyntaxKind.SyntaxList);

  const returnStatement = arrowFuncBlock.getFirstChildByKind(
    SyntaxKind.ReturnStatement
  );

  const savedReturnText = strip(returnStatement.getText());
  console.log('savedReturnText: ', savedReturnText);

  // FIXME: 只会拿到第一个变量声明
  const configVarIdentifier = arrowFuncBlock
    // const config = {} as DefaultConfig;
    .getFirstChildByKind(SyntaxKind.VariableStatement)
    .getFirstChildByKind(SyntaxKind.VariableDeclarationList)
    .getFirstChildByKind(SyntaxKind.SyntaxList)
    //  [ 'Identifier', 'EqualsToken', 'AsExpression' ]
    .getFirstChildByKind(SyntaxKind.VariableDeclaration)
    .getFirstChildByKind(SyntaxKind.Identifier)
    .getText();

  const existPropAssignmentKeys = arrowFuncBlock
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
    consola.error(`${configVarIdentifier}.${key} exist !`);
    process.exit(0);
  }

  // 只有存在需要添加的key，才会删除返回语句
  returnStatement.asKind(SyntaxKind.ReturnStatement).remove();

  // FIXME:
  arrowFuncBlock.addStatements(
    `${configVarIdentifier}.${key} = ${JSON.stringify(value)}`
  );

  console.log(arrowFuncBlock.getChildren().map(x => x.getKindName()));

  // ExpressionStatement
  // SingleLineCommentTrivia

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

export function updateArrayTypeConfig() {}

export function updateObjectTypeConfig() {}

export function updatePrimitiveTypeConfig() {}
