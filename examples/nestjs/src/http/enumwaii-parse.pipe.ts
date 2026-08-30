import { BadRequestException, type PipeTransform } from "@nestjs/common";
import {
  type Enumwaii,
  type EnumwaiiParseOptions,
  type EnumwaiiValue,
} from "enumwaii";

export class EnumwaiiParsePipe<
  TRaw extends string,
  TIdentity extends string,
> implements PipeTransform<unknown, EnumwaiiValue<TRaw, TIdentity>> {
  public constructor(
    private readonly schema: Enumwaii<TRaw, TIdentity>,
    private readonly parseOptions: EnumwaiiParseOptions<
      EnumwaiiValue<TRaw, TIdentity>
    > = {},
    private readonly fieldName = "value",
  ) {}

  public transform(value: unknown): EnumwaiiValue<TRaw, TIdentity> {
    const result = this.schema.safeParse(value, this.parseOptions);
    if (result.success) {
      return result.value;
    }

    throw new BadRequestException({
      statusCode: 400,
      error: "Bad Request",
      message: `Invalid ${this.fieldName}`,
    });
  }
}
