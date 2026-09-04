import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import type { HydratedDocument } from "mongoose";

import {
  SEVERITY_DB_ENUM,
  SEVERITY_DB_VALUES,
  TICKET_STATUS_DB_ENUM,
  TICKET_STATUS_DB_VALUES,
} from "../domain/ticket-status";

export type RawTicketStatus = (typeof TICKET_STATUS_DB_VALUES)[number];
export type RawSeverity = (typeof SEVERITY_DB_VALUES)[number];

@Schema({ collection: "tickets", timestamps: true, versionKey: false })
export class TicketRecord {
  @Prop({
    type: String,
    enum: TICKET_STATUS_DB_VALUES,
    default: TICKET_STATUS_DB_ENUM.OPEN,
    required: true,
  })
  public status!: RawTicketStatus;

  @Prop({
    type: String,
    enum: SEVERITY_DB_VALUES,
    default: SEVERITY_DB_ENUM.NORMAL,
    required: true,
  })
  public severity!: RawSeverity;

  @Prop({ type: String, trim: true, maxlength: 140, required: true })
  public subject!: string;

  @Prop({ type: String, trim: true, maxlength: 500, default: null })
  public memo!: string | null;

  @Prop({ type: Number, min: 1, default: 1, required: true })
  public version!: number;

  public createdAt!: Date;
  public updatedAt!: Date;
}

export type TicketDocument = HydratedDocument<TicketRecord>;
export const TicketSchema = SchemaFactory.createForClass(TicketRecord);
