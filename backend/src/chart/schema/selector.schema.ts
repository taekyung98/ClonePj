import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type SelectorDocument = Selector & Document;

@Schema()
export class Selector {
  @Prop()
  _id: string;
  @Prop()
  selectCode: string;
  @Prop()
  selectorName: string;
  @Prop()
  selector: number;
}

export const SelectorSchema = SchemaFactory.createForClass(Selector);
