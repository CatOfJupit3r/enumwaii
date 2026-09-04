import { Controller, Get, Header } from "@nestjs/common";

import { renderTicketConsole } from "./ui/ticket-dashboard";

@Controller()
export class UiController {
  @Get()
  @Header("content-type", "text/html; charset=utf-8")
  public index(): string {
    return renderTicketConsole();
  }
}
