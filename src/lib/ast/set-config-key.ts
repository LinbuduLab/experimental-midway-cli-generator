import {
  ArrowFunction,
  SourceFile,
  SyntaxKind,
  VariableDeclarationKind,
} from 'ts-morph';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as prettier from 'prettier';
import * as strip from 'strip-comments';

export function setConfigKey(source: SourceFile, key: string, value: any) {
  // 获取默认导出的箭头函数
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

  // FIXME:
  arrowFunc.addStatements(`config.${key} = ${JSON.stringify(value)}`);

  arrowFunc.addStatements(stripedReturnStatement);

  source.saveSync();

  const absWritePath = source.getFilePath();

  const formatted = prettier.format(
    fs.readFileSync(absWritePath, { encoding: 'utf8' }),
    {
      parser: 'typescript',
    }
  );

  fs.writeFileSync(absWritePath, formatted);
}
