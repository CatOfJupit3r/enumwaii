import { Controller, Get, Header } from "@nestjs/common";

import { renderOrderConsole } from "./ui/order-console";

@Controller()
export class UiController {
  @Get()
  @Header("content-type", "text/html; charset=utf-8")
  public index(): string {
    return renderOrderConsole();
  }
}
