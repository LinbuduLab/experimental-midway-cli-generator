import { Provide } from "@midwayjs/decorator";
import { IMidwayExpressContext, IWebMiddleware } from "@midwayjs/express";
import { NextFunction, Request, Response } from "express";

@Provide("Mw")
export default class Mw implements IWebMiddleware {
  resolve() {
    return async (req: Request, res: Response, next: NextFunction) => {};
  }
}
