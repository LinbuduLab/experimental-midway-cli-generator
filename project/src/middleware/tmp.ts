import { Provide } from "@midwayjs/decorator";
import { IWebMiddleware, IMidwayWebNext } from "@midwayjs/web";
import { Context } from "egg";

@Provide()
export class Tmp implements IWebMiddleware {
  resolve() {
    return async (ctx: Context, next: IMidwayWebNext) => {};
  }
}
