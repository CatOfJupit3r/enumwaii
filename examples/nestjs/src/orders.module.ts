import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { BoundaryController, OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { OrderRecord, OrderSchema } from "./persistence/order.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OrderRecord.name, schema: OrderSchema },
    ]),
  ],
  controllers: [OrdersController, BoundaryController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
