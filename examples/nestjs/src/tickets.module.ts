import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { TicketsController } from "./tickets.controller";
import { TicketsService } from "./tickets.service";
import { TicketRecord, TicketSchema } from "./persistence/ticket.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TicketRecord.name, schema: TicketSchema },
    ]),
  ],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
