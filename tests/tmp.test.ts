import { runner, KEYS } from 'clet';
import * as path from 'path';

describe('tmp', () => {
  it('should works with boilerplate', async () => {
    await runner()
      .cwd(path.resolve(__dirname, '../tmp'), { init: true })
      .spawn('npm -v')
      .stdin(/name:/, 'example') // wait for stdout, then respond
      .stdin(/version:/, new Array(9).fill(KEYS.ENTER))
      .stdout(/"name": "example"/) // validate stdout
      .notStderr(/npm ERR/)
      .file('package.json', { name: 'example', version: '1.0.0' }); // validate file
  });
});
