import { Provide } from "@midwayjs/decorator";

import { IWebMiddleware } from "@midwayjs/koa";
import ThirdPartyLib from "ThirdPartyLib";

@Provide("Mw")
export default class Mw implements IWebMiddleware {
  resolve() {
    return ThirdPartyLib();
  }
}
