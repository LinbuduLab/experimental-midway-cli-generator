import {
  ArrowFunction,
  Project,
  SyntaxKind,
  VariableDeclarationKind,
} from 'ts-morph';
import * as path from 'path';
import * as strip from 'strip-comments';

const project = new Project();

const source = project.addSourceFileAtPath(
  path.resolve(__dirname, '../../base/config-origin/config.default.ts')
);

// 拿到默认导出 √
// 拿到箭头函数 √
// 拿到箭头函数内部进行分析 √
// 新增 config.orm = {} √
// 修改configuration
// 新增import * as orm from "@midwayjs/orm"
// 查看package.json是否存在 不存在则代替安装
// 新增connection相关代码

// -----
// 直接新增 export const orm
// addExport addXX 好像不行...?
const variableStatement = source.addStatements('export const orm = {}');

project.saveSync();

// -----

const t1 = source
  .getExportedDeclarations()
  .get('default')[0]
  .asKind(SyntaxKind.ArrowFunction);

// 能直接对BODY进行分析吗 不能的话就新建一个tmp文件？
const t2 = t1.getFullText();

// console.log('t2: ', t2);

// const config = {} as DefaultConfig;
// const t21 = t1.getLocal('config').getValueDeclaration().getFullText();
// config
const t21 = t1.getLocal('config').getName();

// const ss = t1.getStatements().map(s => s.getText());
// console.log('ss: ', ss);

// const t3 = ss.slice(-1)[0];
// console.log('t3: ', t3);
// console.log('t3: ', t3);
// t1.addStatements('config.x = 1; ');

const s = t1.getStatement(s => s.getKind() === SyntaxKind.ReturnStatement);
// console.log('s: ', s.getFullText());
const x = strip(s.getText());

// console.log(s.getChildIndex());

// t1.removeStatement(9);
// t1.removeStatement(t1.getStatements().length - 1);

// t1.addStatements('config.orm = {}');

// const so3 = t1.getStatement(
//   s => s.getKind() === SyntaxKind.ExpressionStatement
// );
// const so4 = t1.getStatements()[1].getKind();

// console.log(so3.getDescendantsOfKind(SyntaxKind.PropertyAssignment));
// [ 'config.keys', 'appInfo.name' ]
// console.log(
//   so3
//     .getDescendantsOfKind(SyntaxKind.PropertyAccessExpression)
//     .map(x => x.getText())
// );

// console.log(so4);

// t1.addStatements(`\n ${x}`);

// 再format一下就行了
// project.saveSync();

// console.log('t21: ', t21);

// import * as orm
// const importDeclaration = source.addImportDeclaration({
//   namespaceImport: 'orm',
//   moduleSpecifier: '@midwayjs/orm',
// });

// import { EntityModel }
// const importDeclaration = source.addImportDeclaration({
//   namedImports: ['EntityModel'],
//   moduleSpecifier: '@midwayjs/orm',
// });

// project.saveSync();
