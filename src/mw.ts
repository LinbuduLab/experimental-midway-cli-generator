import { IWebMiddleware, IMidwayWebNext } from "@midwayjs/web";
import { Context } from "egg";

export const Mw1 = () => {
  return async function (ctx: Context, next: IMidwayWebNext) {};
};
