import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Select, SelectDocument } from './schema/select.schema';

export class ChartRepository {
  constructor(
    @InjectModel(Select.name) private selectModel: Model<SelectDocument>,
  ) {}

  async selectList(): Promise<string[]> {
    return this.selectModel.find({});
  }

  async getSelectorList(firstVarialble: string) {
    return [];
  }

  async getChartList(param: {
    download: boolean;
    secondOption: number[];
    firstVariable: string;
    firstOption: number[];
    endDate: number;
    secondVariable: string;
    startDate: number;
  }) {}
}
