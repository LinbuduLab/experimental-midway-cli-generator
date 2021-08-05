import { App, Configuration } from "@midwayjs/decorator";
import { ILifeCycle } from "@midwayjs/core";
import { Application } from "egg";
import { join } from "path";
import * as cache from "@midwayjs/cache";

@Configuration({
  imports: [cache],
  importConfigs: [join(__dirname, "./config")],
  conflictCheck: true,
})
export class ContainerLifeCycle implements ILifeCycle {
  @App()
  app: Application;

  async onReady() {}
}
