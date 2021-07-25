import { Controller, Inject, Get, Provide } from "@midwayjs/decorator";

@Provide()
@Controller("/")
export class User {
  @Get("/")
  async home(): Promise<string> {
    return "Hello Midwayjs!";
  }
}
