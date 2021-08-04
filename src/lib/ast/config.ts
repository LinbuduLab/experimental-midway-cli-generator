import {
  SourceFile,
  SyntaxKind,
  VariableDeclarationKind,
  VariableStatement,
} from 'ts-morph';
import strip from 'strip-comments';
import consola from 'consola';

// 新增 export const x = {}
export function addConstExport(
  source: SourceFile,
  key: string,
  value: any,
  useStringify = true,
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
          initializer: writer =>
            writer.write(useStringify ? JSON.stringify(value) : value),
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

// 获取所有的导出语句（可根据export的identifier查找）
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

// 获取所有的导出语句的变量值
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

export function removeConstExport(
  source: SourceFile,
  identifier?: string,
  apply = true
) {
  const exportVars = getExportVariableIdentifiers(source);

  if (identifier && !exportVars.includes(identifier)) {
    consola.error(`export ${identifier} doesnot exist!`);
    return;
  }

  identifier
    ? getExportVariableStatements(source, identifier).remove()
    : exportVars.forEach(exp =>
        getExportVariableStatements(source, exp).remove()
      );

  apply && source.saveSync();
}

export function updateConstConfigIdentifier(
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

  const targetVarDeclaration = targetVar
    .getFirstChildByKind(SyntaxKind.VariableDeclarationList)
    .getFirstChildByKind(SyntaxKind.SyntaxList)
    .getFirstChildByKind(SyntaxKind.VariableDeclaration);

  const targetVarValueNode = targetVarDeclaration.getLastChild();

  const targetVarValueKind = targetVarValueNode.getKind();
  const targetVarTextValue = targetVarValueNode.getText();

  if (targetVarValueKind === SyntaxKind.NumericLiteral) {
    addConstExport(
      source,
      updatedKey,
      Number(targetVarTextValue),
      undefined,
      false
    );
    targetVar.remove();
  } else if (targetVarValueKind === SyntaxKind.StringLiteral) {
    addConstExport(
      source,
      updatedKey,
      String(targetVarTextValue).replaceAll("'", ''),
      undefined,
      false
    );
    targetVar.remove();
  } else if (
    [SyntaxKind.TrueKeyword, SyntaxKind.FalseKeyword].includes(
      targetVarValueKind
    )
  ) {
    addConstExport(
      source,
      updatedKey,
      targetVarTextValue !== 'false',
      undefined,
      false
    );
    targetVar.remove();
  } else if (targetVarValueKind === SyntaxKind.ArrowFunction) {
    addConstExport(source, updatedKey, targetVarTextValue, false, false);
    targetVar.remove();
  } else if (targetVarValueKind === SyntaxKind.ObjectLiteralExpression) {
    addConstExport(source, updatedKey, targetVarTextValue, false, false);
    targetVar.remove();
  }

  apply && source.saveSync();
}

// 新增类型定义 export const x:xxx = {}
export function addConstExportTypeRef(
  source: SourceFile,
  exportVar: string,
  typeRef: string
) {}

// 新增类型断言
export function addConstExportTypeAssertion() {}

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
