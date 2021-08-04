import {
  ArrowFunction,
  SourceFile,
  SyntaxKind,
  VariableDeclarationKind,
  ts,
  VariableStatement,
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

  const exportVars = getExportVariableIdentifiers(source);

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

export function getExportVariableStatements(
  source: SourceFile,
  varIdentifier: string
): VariableStatement;

export function getExportVariableStatements(
  source: SourceFile
): VariableStatement[];

export function getExportVariableStatements(
  source: SourceFile,
  varIdentifier?: string
): VariableStatement | VariableStatement[] {
  const topLevelVarStatements = source
    .getFirstChildByKind(SyntaxKind.SyntaxList)
    .getChildrenOfKind(SyntaxKind.VariableStatement);

  const exportVarStatements = topLevelVarStatements.filter(v => {
    const syntaxBeforeVarIdentifier = v.getFirstChildIfKind(
      SyntaxKind.SyntaxList
    );

    return (
      syntaxBeforeVarIdentifier &&
      syntaxBeforeVarIdentifier.getText() &&
      syntaxBeforeVarIdentifier.getText() === 'export'
    );
  });

  if (varIdentifier) {
    return exportVarStatements.find(statement => {
      return (
        statement
          .getFirstChildByKind(SyntaxKind.VariableDeclarationList)
          .getFirstChildByKind(SyntaxKind.SyntaxList)
          .getFirstChildByKind(SyntaxKind.VariableDeclaration)
          .getFirstChildByKind(SyntaxKind.Identifier)
          .getText() === varIdentifier
      );
    });
  }

  return exportVarStatements;
}

export function getExportVariableIdentifiers(source: SourceFile): string[] {
  const exportVarStatements = getExportVariableStatements(source);
  const exportVars = exportVarStatements.map(v =>
    v
      .getFirstChildByKind(SyntaxKind.VariableDeclarationList)
      .getFirstChildByKind(SyntaxKind.SyntaxList)
      .getFirstChildByKind(SyntaxKind.VariableDeclaration)
      // [ 'Identifier', 'EqualsToken', 'ObjectLiteralExpression' ]
      .getFirstChildByKind(SyntaxKind.Identifier)
      .getText()
  );

  return exportVars;
}

export function updateConfigExportIdentifier(
  source: SourceFile,
  currentKey: string,
  updatedKey: string,
  apply = true
) {
  const exportVars = getExportVariableIdentifiers(source);

  if (!exportVars.includes(currentKey)) {
    consola.error(`export ${currentKey} doesnot exist!`);
    return;
  }

  const targetVar = getExportVariableStatements(source, currentKey);

  // source
  //   .addVariableStatement({
  //     declarationKind: VariableDeclarationKind.Const,
  //     declarations: [
  //       {
  //         name: key,
  //         initializer: writer => writer.write(JSON.stringify(value)),
  //       },
  //     ],
  //   })
  //   .setIsExported(true);

  // apply && source.saveSync();
}

// export const x:xxx = {}
export function addTypeRefToExistExportConst(
  source: SourceFile,
  exportVar: string,
  typeRef: string
) {}

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
