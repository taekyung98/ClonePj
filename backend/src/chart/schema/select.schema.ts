import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type SelectDocument = Select & Document;

@Schema()
export class Select {
    @Prop()
    _id: string;
    @Prop()
    selectCode: string;
    @Prop()
    selectName: string;
}

export const SelectSchema = SchemaFactory.createForClass(Select);
