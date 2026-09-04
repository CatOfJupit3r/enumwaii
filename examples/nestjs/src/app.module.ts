import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";

import { TicketDomainExceptionFilter } from "./http/ticket-domain-exception.filter";
import { TicketsModule } from "./tickets.module";
import { UiController } from "./ui.controller";

export const DEFAULT_MONGODB_URI =
  "mongodb://127.0.0.1:27017/enumwaii_nest_tickets";

@Module({
  imports: [
    MongooseModule.forRoot(process.env["MONGODB_URI"] ?? DEFAULT_MONGODB_URI, {
      serverSelectionTimeoutMS: 5_000,
    }),
    TicketsModule,
  ],
  controllers: [UiController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: TicketDomainExceptionFilter,
    },
  ],
})
export class AppModule {}
