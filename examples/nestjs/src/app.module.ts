import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";

import { OrderDomainExceptionFilter } from "./http/order-domain-exception.filter";
import { OrdersModule } from "./orders.module";
import { UiController } from "./ui.controller";

export const DEFAULT_MONGODB_URI =
  "mongodb://127.0.0.1:27017/enumwaii_nest_orders";

@Module({
  imports: [
    MongooseModule.forRoot(process.env["MONGODB_URI"] ?? DEFAULT_MONGODB_URI, {
      serverSelectionTimeoutMS: 5_000,
    }),
    OrdersModule,
  ],
  controllers: [UiController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: OrderDomainExceptionFilter,
    },
  ],
})
export class AppModule {}
