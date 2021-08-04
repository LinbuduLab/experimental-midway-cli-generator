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
export function addConfigExport(
  source: SourceFile,
  key: string,
  value: any,
  apply = true
) {
  // 又可以抽离成export相关的方法
  // 拿到所有export const 检查是否已存在
  // 不允许value是函数
  // 添加类型提示的方式
  // const exports

  const topLevelVarStatements = source
    .getFirstChildByKind(SyntaxKind.SyntaxList)
    .getChildrenOfKind(SyntaxKind.VariableStatement);

  const exportVarDecs = topLevelVarStatements.filter(v => {
    const syntaxBeforeVarIdentifier = v.getFirstChildIfKind(
      SyntaxKind.SyntaxList
    );

    return (
      syntaxBeforeVarIdentifier &&
      syntaxBeforeVarIdentifier.getText() &&
      syntaxBeforeVarIdentifier.getText() === 'export'
    );
  });
  const exportVars = exportVarDecs.map(v =>
    v
      .getFirstChildByKind(SyntaxKind.VariableDeclarationList)
      .getFirstChildByKind(SyntaxKind.SyntaxList)
      .getFirstChildByKind(SyntaxKind.VariableDeclaration)
      // [ 'Identifier', 'EqualsToken', 'ObjectLiteralExpression' ]
      .getFirstChildByKind(SyntaxKind.Identifier)
      .getText()
  );

  // console.log('exportVarStatements: ', exportVars);

  // console.log(
  //   exportVarDecs[0]
  //     .getFirstChildByKind(SyntaxKind.VariableDeclarationList)
  //     .getFirstChildByKind(SyntaxKind.SyntaxList)
  //     .getFirstChildByKind(SyntaxKind.VariableDeclaration)
  //     .getChildren()
  //     .map(x => x.getKindName())
  // );

  if (exportVars.includes(key)) {
    consola.error(`export ${key} exist!`);
    return;
  }

  source
    .addVariableStatement({
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: key,
          initializer: writer => writer.write(JSON.stringify(value)),
        },
      ],
    })
    .setIsExported(true);

  apply && source.saveSync();
}

export function addTypeRefToExistExportConst() {}

export function addTypeAssertionToExistExportConst() {}

// config.x = {}
// 仅适用于默认导出方法形式
export function addConfigKey(
  source: SourceFile,
  key: string,
  value: any,
  apply = true
) {
  const arrowFunc = source
    .getFirstChildByKind(SyntaxKind.SyntaxList)
    .getFirstChildByKind(SyntaxKind.ExportAssignment)
    .getFirstChildByKind(SyntaxKind.ArrowFunction);

  const returnStatement = arrowFunc
    .getFirstChildByKind(SyntaxKind.Block)
    .getFirstChildByKind(SyntaxKind.ReturnStatement);

  const stripedReturnStatement = strip(returnStatement.getText());

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
    console.error(`${configVarIdentifier}.${key} exist !`);
    process.exit(0);
  }

  returnStatement.remove();

  // FIXME:
  arrowFunc.addStatements(
    `${configVarIdentifier}.${key} = ${JSON.stringify(value)}`
  );

  arrowFunc.addStatements(stripedReturnStatement);

  apply && source.saveSync();

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
