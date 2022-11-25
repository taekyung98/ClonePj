import { IsArray, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class ListChartDto {
  @IsDateString()
  @Type(() => Date)
  readonly startDate: Date;

  @IsDateString()
  @Type(() => Date)
  readonly endDate: Date;

  @IsArray()
  readonly selectors: string[];

  @IsArray()
  readonly firstOptions?: number[];

  @IsArray()
  readonly secondOptions?: number[];
}
