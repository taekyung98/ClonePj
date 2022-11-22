import { Injectable } from '@nestjs/common';
import {ChartRepository} from "./chart.repository";

@Injectable()
export class ChartService {
    constructor(
        private readonly chartRepository: ChartRepository,
    ) {}

    selectList(): Promise<string[]> {
        return this.chartRepository.selectList();
    }
}
