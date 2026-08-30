import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import type { HydratedDocument } from "mongoose";

import {
  ORDER_STATUS_DB_ENUM,
  ORDER_STATUS_DB_VALUES,
} from "../domain/order-status";

export type RawOrderStatus = (typeof ORDER_STATUS_DB_VALUES)[number];

@Schema({
  collection: "orders",
  timestamps: true,
  versionKey: false,
})
export class OrderRecord {
  @Prop({
    type: String,
    enum: ORDER_STATUS_DB_VALUES,
    default: ORDER_STATUS_DB_ENUM.PENDING,
    required: true,
  })
  public status!: RawOrderStatus;

  @Prop({ type: String, trim: true, maxlength: 180, default: null })
  public memo!: string | null;

  @Prop({ type: Number, min: 1, default: 1, required: true })
  public version!: number;

  public createdAt!: Date;
  public updatedAt!: Date;
}

export type OrderDocument = HydratedDocument<OrderRecord>;
export const OrderSchema = SchemaFactory.createForClass(OrderRecord);
