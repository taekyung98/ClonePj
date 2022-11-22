import { Module } from '@nestjs/common';
import { ChartController } from './chart.controller';
import { ChartService } from './chart.service';
import {Select, SelectSchema} from "./schema/select.schema";
import {MongooseModule} from "@nestjs/mongoose";
import {ChartRepository} from "./chart.repository";
import {ConfigModule} from "@nestjs/config";

@Module({
  imports:[
    ConfigModule.forRoot({
      envFilePath: process.env.NODE_ENV === 'production' ? '.env' : '.env.dev',
      isGlobal: true,
    }),
    MongooseModule.forFeature([
      { name: Select.name, schema: SelectSchema },
    ]),
  ],
  controllers: [ChartController],
  providers: [ChartService,ChartRepository]
})
export class ChartModule {}
