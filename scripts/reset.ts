import fs from 'fs-extra';
import path from 'path';
import cpy from 'cpy';

export async function resetLocalProject() {
  const sourceTemplateDirPath = path.join(__dirname, './source');
  const prevProjectDirPath = path.join(__dirname, '../project');

  const prevProjectDirPathTmp = path.join(__dirname, '../project-tmp');

  fs.ensureDirSync(prevProjectDirPathTmp);
  fs.existsSync(prevProjectDirPath) &&
    fs.rmSync(prevProjectDirPath, { recursive: true });

  // project/source
  await cpy('source/**', '../project-tmp', {
    parents: true,
    cwd: path.resolve(process.cwd(), 'scripts'),
  }).on('progress', e => {
    // console.log(e);
  });

  // project/source -> project
  fs.moveSync(path.resolve(__dirname, '../project-tmp/source'), 'project');

  fs.rmdirSync(prevProjectDirPathTmp);
}

(async () => {
  await resetLocalProject();
})();
