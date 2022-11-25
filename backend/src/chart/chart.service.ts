import { Injectable, StreamableFile } from '@nestjs/common';
import { ChartRepository } from './chart.repository';
import { ListChartDto } from './dto/list.chart.dto';
import { SelectChartDto } from './dto/select.chart.dto';

import moment from 'moment';
import _ from 'lodash';
import * as fs from 'fs';
import type { Response } from 'express';
import { Workbook } from 'exceljs';

@Injectable()
export class ChartService {
  constructor(private readonly chartRepository: ChartRepository) {}

  selectList(): Promise<string[]> {
    return this.chartRepository.selectList();
  }

  //차트 데이터 가져오기
  async getList(body: ListChartDto) {
    const { startDate, endDate, selectors, firstOptions, secondOptions } = body; //담아서 전송하는 리스트 내역
    const [firstVariable, secondVariable] = selectors; // 선택 변수 리스트 내역

    // 선택한 변수의 문항 값 리스트 가져오기
    const firstList: SelectChartDto[] =
      await this.chartRepository.getSelectorList(firstVariable); //첫번째로 선택한 변수 값
    const secondList: SelectChartDto[] = secondVariable
      ? await this.chartRepository.getSelectorList(secondVariable)
      : []; //두번째로 선택한 변수 값

    //변수의 서브옵션 선택 안했을때 전체옵션 넣어주기 (변수가 클릭되어있는 상태니까 전체옵션 넣어주는 로직 필요)
    let firstOptionList = [];
    let secondOptionList = [];
    if (!firstOptions) {
      firstOptionList = firstList.map((item) => {
        return item.selector;
      });
    } else {
      firstOptionList = firstOptions;
    }
    if (secondVariable && !secondOptions) {
      secondOptionList = secondList.map((item) => {
        return item.selector;
      });
    } else {
      secondOptionList = secondOptions;
    }

    //선택한 기간 담은 데이터
    const dateDiffArray = this.getBetweenDate(startDate, endDate);

    //선택한 분석변수가 담긴 데이터 정보에 축적
    const firstMap: Map<number, SelectChartDto> = firstList.reduce(
      (prev, cur) => {
        const { selector } = cur;
        prev.set(selector, cur);
        return prev;
      },
      new Map(),
    );

    const secondMap: Map<number, SelectChartDto> = secondList.reduce(
      (prev, cur) => {
        const { selector } = cur;
        prev.set(selector, cur);
        return prev;
      },
      new Map(),
    );

    //세부 옵션값 숫자로 전환
    const firstOpts = firstOptionList.map((item) => {
      return Number(item);
    });
    //삼항 연산자
    const secondOpts = secondVariable
      ? secondOptionList.map((item) => {
          return Number(item);
        })
      : [];

    //getChartList 생성 이전 aggregate상태 void (return값이 없는 상태)
    const aggregate = await this.chartRepository.getChartList({
      startDate: Math.min(...dateDiffArray),
      endDate: Math.max(...dateDiffArray),
      firstVariable,
      secondVariable,
      firstOption: firstOpts,
      secondOption: secondOpts,
      download: false,
    });

    const result = aggregate.map((item) => {
      const {
        _id: { first, second, crym },
        buy,
        count,
      } = item;
      const firstCode = firstMap.get(first);
      const secondCode = secondVariable ? secondMap.get(second) : null;

      const firstName = firstCode ? firstCode.selectorName : null;
      const secondName = secondCode ? secondCode.selectorName : null;

      return {
        label: [firstName, secondName].filter((_) => _).join('/'),
        crym,
        buy,
        count,
      };
    });

    const data = _.groupBy(result, 'label');

    const [top] = this.pickTopScore(data, 'buy');
    return {
      data,
      dates: dateDiffArray,
      top,
      topLabel: this.pickTopScoreLabel(top, 'buy'),
    };
  }

  // 최대금액, 최대 구매자 수 문항 구하기
  private pickTopScore(
    data: _.Dictionary<
      {
        label: string;
        crym: number;
        buy: number;
        count: number;
      }[]
    >,
    keyword: string,
  ) {
    const values = Object.entries(data).map(([key, value]) => {
      const mean = _.meanBy(value, keyword);
      return {
        key,
        mean,
      };
    });
    return _.sortBy(values, 'mean').reverse();
  }

  private pickTopScoreLabel(
    { key, mean }: { key: string; mean: number },
    keyword: string,
  ) {
    return [
      `<span style="color: red;">${key}</span>`,
      `의 월 평균 ${keyword === 'buy' ? '결제 금액이' : '구매자 수는'}`,
      `<span style="color:blue;">${this.monetaryUnit(mean, keyword)}</span>`,
      `으로 가장 높습니다.`,
    ];
  }

  //단위 붙이기
  private monetaryUnit(value: number, keyword: string) {
    if (value > 1e8)
      return `${(value / 1e8).toFixed(1)}억${keyword === 'buy' ? '원' : '명'}`; // 억단위
    if (value > 1e4)
      return `${(value / 1e4).toFixed(1)}만${keyword === 'buy' ? '원' : '명'}`; // 만단위
    if (value > 1e3)
      return `${(value / 1e3).toFixed(1)}천${keyword === 'buy' ? '원' : '명'}`; // 천단위
    return `${value.toFixed(1)}${keyword === 'buy' ? '원' : '명'}`;
  }

  //npm month
  //날짜 값 format
  private getBetweenDate(startDate: Date, endDate: Date): number[] {
    const diff = moment(endDate).diff(startDate, 'months');
    return new Array(diff + 1).fill(0).map((_, i) => {
      const currentDate = moment(startDate).add(i, 'months');
      return +moment(currentDate).format('YYYYMM');
    });
  }

  //다운로드 데이터 조회
  async getDataList(body: ListChartDto) {
    const { startDate, endDate, selectors, firstOptions, secondOptions } = body;
    const [firstVariable, secondVariable] = selectors;
    const firstList: SelectChartDto[] =
      await this.chartRepository.getSelectorList(firstVariable);
    const secondList: SelectChartDto[] = secondVariable
      ? await this.chartRepository.getSelectorList(secondVariable)
      : [];
    const dateDiffArray = this.getBetweenDate(startDate, endDate);

    //서브 옵션 선택 안했을때 전체 옵션 널어주기
    let firstOptionList = [];
    let secondOptionList = [];
    if (!firstOptions) {
      firstOptionList = firstList.map((item) => {
        return item.selector;
      });
    } else {
      firstOptionList = firstOptions;
    }
    if (secondVariable && !secondOptions) {
      secondOptionList = secondList.map((item) => {
        return item.selector;
      });
    } else {
      secondOptionList = secondOptions;
    }

    const firstMap: Map<number, SelectChartDto> = firstList.reduce(
      (prev, cur) => {
        const { selector } = cur;
        prev.set(selector, cur);
        return prev;
      },
      new Map(),
    );

    const secondMap: Map<number, SelectChartDto> = secondList.reduce(
      (prev, cur) => {
        const { selector } = cur;
        prev.set(selector, cur);
        return prev;
      },
      new Map(),
    );

    const firstOpts = firstOptionList.map((item) => {
      return Number(item);
    });
    const secondOpts = secondVariable
      ? secondOptionList.map((item) => {
          return Number(item);
        })
      : [];

    const aggregate = await this.chartRepository.getChartList({
      startDate: Math.min(...dateDiffArray),
      endDate: Math.max(...dateDiffArray),
      firstVariable,
      secondVariable,
      firstOption: firstOpts,
      secondOption: secondOpts,
      download: true,
    });

    const result = aggregate.map((item) => {
      const {
        _id: { first, second, crym },
        buy,
        count,
      } = item;
      const firstCode = firstMap.get(first);
      const secondCode = secondVariable ? secondMap.get(second) : null;

      if (secondCode) {
        return {
          [`${firstCode.selectCode}`]: firstCode.selector,
          [`${secondCode.selectCode}`]: secondCode.selector,
          crym,
          BUY_sum: buy,
          cnt_cno_sum: count,
        };
      }
    });
    return {
      data: result,
    };
  }

  // Response -> 따로 import 시켜야됨
  async generateCSV(dto: ListChartDto, res: Response) {
    const { selectors } = dto;

    //다운로드 데이터
    const result = await this.getDataList(dto);
    const { data: list } = result; // data -> getData 리스트 데이터
    const [firstV, secondV] = selectors; // 선택값에 해당하는 정보

    const fileName = `${new Date().getTime().toString()}.csv`;
    const bom = '\uFEFF';

    //임시 생성 stream
    const stream = fs.createWriteStream(fileName); //파일 읽을 stream
    const titles = Object.keys(list[0]);
    stream.write(`\uFEFF${titles.join(',')}\r\n`);

    //값이 이미 있는 경우 데이터 삭제
    while (list.length) {
      const cur = list.shift(); //data array 맨앞 값 제거
      const row = secondV
        ? [
            cur[firstV],
            cur[secondV],
            cur.crym,
            cur.BUY_sum,
            cur.cnt_cno_sum,
          ].join(',')
        : [cur[firstV], cur.crym, cur.BUY_sum, cur.cnt_cno_sum].join(',');
      stream.write('\uFEFF' + row);
      stream.write('\r\n');
      if (list.length === 0) {
        stream.end();
      }
    }
    const file = fs.createReadStream(stream.path);
    file.on('end', () => {
      if (fs.existsSync(stream.path)) fs.unlinkSync(stream.path);
    });
    //CSV파일 다운로드시 한글깨짐 방지
    res.setHeader('content-type', 'text/csv;charset=utf-8,%EF%BB%BF;');
    //attachment -> 모든 확장자의 파일들에 대해 다운로드시 무조건 '파일 다운로드' 대화상자가 뜨도록하는 헤더 속성
    res.setHeader('content-disposition', `attachment; `);
    const returnData = new StreamableFile(file);
    return returnData;
  }

  async getGuideList(dto: ListChartDto, res: Response) {
    //excel.js 내 Workbook 사용
    const workbook = new Workbook();

    //데이터 시트
    const { selectors } = dto;
    const result = await this.getDataList(dto);
    const { data: list } = result;
    const [firstV, secondV] = selectors;
    const excelData = [];
    if (secondV) {
      list.forEach((item) => {
        excelData.push([
          item[firstV],
          item[secondV],
          item.crym,
          item.BUY_sum,
          item.cnt_cno_sum,
        ]);
      });
    } else {
      list.forEach((item) => {
        excelData.push([
          item[firstV],
          item.crym,
          item.BUY_sum,
          item.cnt_cno_sum,
        ]);
      });
    }

    const sheet1 = workbook.addWorksheet('data');
    if (secondV) {
      // get.Cell -> worksheet 내장되어있는 기능
      sheet1.getCell('A1').value = firstV;
      sheet1.getCell('A1').font = { bold: true };
      sheet1.getCell('B1').value = secondV;
      sheet1.getCell('B1').font = { bold: true };
      sheet1.getCell('C1').value = 'crym';
      sheet1.getCell('C1').font = { bold: true };
      sheet1.getCell('D1').value = 'BUY_sum';
      sheet1.getCell('D1').font = { bold: true };
      sheet1.getCell('E1').value = 'cnt_cno_sum';
      sheet1.getCell('E1').font = { bold: true };
    } else {
      sheet1.getCell('A1').value = firstV;
      sheet1.getCell('A1').font = { bold: true };
      sheet1.getCell('C1').value = 'crym';
      sheet1.getCell('C1').font = { bold: true };
      sheet1.getCell('D1').value = 'BUY_sum';
      sheet1.getCell('D1').font = { bold: true };
      sheet1.getCell('E1').value = 'cnt_cno_sum';
      sheet1.getCell('E1').font = { bold: true };
    }
    sheet1.addRows(excelData);

    //변수가이드 시트 (각 data 변수 이름 부여)
    let selectorGuides = await this.chartRepository.getGuideList();
    const selectNames = await this.chartRepository.getSelectorList();
    const excelGuide = [];
    selectNames.forEach((item) => {
      excelGuide.push([item.selectCode, item.selectName]);
      selectorGuides.forEach((g) => {
        if (g.selectCode === item.selectCode) {
          excelGuide.push([g.selector, g.selectorName]);
        }
      });
    });
    excelGuide.push(['BUY_sum', '결제 금액']);
    excelGuide.push(['cnt_cno_sum', '결제 고객 수']);

    const sheet2 = workbook.addWorksheet('guide');
    sheet2.getCell('A1').value = '변수명';
    sheet2.getCell('A1').font = { bold: true };
    sheet2.getCell('A1').alignment = { horizontal: 'center' };
    sheet2.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFF00' },
      bgColor: { argb: '(251, 229, 215)' },
    };
    sheet2.getCell('B1').value = '문항';
    sheet2.getCell('B1').font = { bold: true };
    sheet2.getCell('B1').alignment = { horizontal: 'center' };
    sheet2.getCell('B1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFF00' },
      bgColor: { argb: '(251, 229, 215)' },
    };
    sheet2.addRows(excelGuide);

    //xlsx 파일의 mime type
    res.setHeader(
      'Content-type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    // 파일 이름 명시
    res.attachment('test.xlsx');

    //다운로드 받기
    await workbook.xlsx.write(res);
    res.end;
  }
}
