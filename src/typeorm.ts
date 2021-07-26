import path = require('path');
import { MidwayCodeMod, ProjectType } from './lib/ast';

const codeMod = new MidwayCodeMod({
  root: path.resolve(__dirname, './base/project/src'), // 项目根目录
  type: ProjectType.INTEGRATION, // 默认为 NORMAL，一体化需要传 ProjectType.INTEGRATION
  singleQuote: true, // 默认为 true，导出的代码中字符串是否使用单引号
});

// 使用export default () => {} 的语法不行
// const x = codeMod.config().get('security', 'local');
// console.log('x: ', x);

codeMod.config().set(
  'test', // 配置的key
  {
    // 多环境的配置
    local: 123,
    default: 200,
  }
);
