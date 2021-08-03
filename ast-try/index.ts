import ts from 'typescript';
import path from 'path';
import fs from 'fs-extra';

const source = ts.createSourceFile(
  './sample.ts',
  fs.readFileSync(path.resolve(__dirname, './sample.ts'), 'utf-8'),
  ts.ScriptTarget.Latest,
  false,
  ts.ScriptKind.TS
);

console.log(source.getFullText());
