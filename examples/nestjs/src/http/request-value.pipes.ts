import { BadRequestException, type PipeTransform } from "@nestjs/common";
import { Types } from "mongoose";

export class MongoIdPipe implements PipeTransform<unknown, string> {
  public transform(value: unknown): string {
    if (
      typeof value !== "string" ||
      !/^[\da-f]{24}$/iu.test(value) ||
      !Types.ObjectId.isValid(value)
    ) {
      throw new BadRequestException("Invalid order id");
    }
    return value;
  }
}

export class PositiveIntegerPipe implements PipeTransform<unknown, number> {
  public transform(value: unknown): number {
    if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
      throw new BadRequestException(
        "expectedVersion must be a positive integer",
      );
    }
    return value;
  }
}

export class OptionalMemoPipe implements PipeTransform<unknown, string | null> {
  public transform(value: unknown): string | null {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value !== "string" || value.length > 180) {
      throw new BadRequestException(
        "memo must be a string of at most 180 characters",
      );
    }
    return value.trim() || null;
  }
}

export const mongoIdPipe = new MongoIdPipe();
export const positiveIntegerPipe = new PositiveIntegerPipe();
export const optionalMemoPipe = new OptionalMemoPipe();
