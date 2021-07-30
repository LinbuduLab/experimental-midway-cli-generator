import {
  Provide,
  Inject,
  ServerlessTrigger,
  ServerlessTriggerType,
  Query,
} from "@midwayjs/decorator";
import { Context, FC } from "@midwayjs/faas";

@Provide()
export class Functions {
  @Inject()
  ctx: Context;

  @ServerlessTrigger(ServerlessTriggerType.HTTP, {
    path: "/",
    method: "get",
  })
  async handleHTTPEvent(@Query() name = "midwayjs") {
    return `Hello ${name}`;
  }

  @ServerlessTrigger(ServerlessTriggerType.EVENT)
  async handleEvent(event: any) {
    return event;
  }

  @ServerlessTrigger(ServerlessTriggerType.TIMER, {
    type: "cron", // or every
    value: "0 0 4 * * *", // or 1m
  })
  async handleTimerEvent(event: FC.TimerEvent) {
    this.ctx.logger.info(event);
    return "hello world";
  }
}
