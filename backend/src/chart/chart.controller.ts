import { Controller, Get, Query } from '@nestjs/common';
import { ChartService } from './chart.service';
import { ListChartDto } from './dto/list.chart.dto';

@Controller('chart')
export class ChartController {
  constructor(private readonly chartService: ChartService) {}

  @Get('/select-list')
  selectList(): Promise<string[]> {
    return this.chartService.selectList();
  }

  @Get('/chart-list')
  getList(@Query() body: ListChartDto) {
    return this.chartService.getList(body);
  }
}
