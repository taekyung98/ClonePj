<template>
  <main>
    <b-card>
      <!-- overlay: 로딩화면 -->
      <!-- operation 중 -> pending상태 -->
      <!-- 즉,pending 상태일때 overlay를 보여준다 -->
      <b-overlay :show="pending">
        <!--  fluid는 해상도와 상관없이 100%의 넓이를 갖는다 -->
        <b-container fluid>
          <b-row>
            <b-col class="p-4">
              <!-- ref="target" 접근하고싶은 태그에 할당 -->
              <DateFilter @update="update" class="py-4" ref="date"></DateFilter>
            </b-col>
          </b-row>

          <b-row>
            <b-col>
              <div class="d-flex justify-content-end">
                <b-button
                  squared
                  size="sm"
                  @click="clickSearch"
                  class="common-btn"
                >
                  <b-icon icon="search" />
                </b-button>
              </div>
            </b-col>
          </b-row>

          <b-row>
            <b-col>
              <hr />
            </b-col>
          </b-row>

          <b-row>
            <b-col>
              <AnalysisFilter
                @update="update"
                @download="download"
                @reset="reset"
                :chart-on="chartOn"
                :download-btn-show="showDownloadBtn"
                ref="analysis"
              ></AnalysisFilter>
            </b-col>

            <b-col>
              <canvas ref="chart"></canvas>
              <hr />
              <!-- v-html -> 태그째로 데이터 바인딩 시킬때 유용함(?)
                               스트링 형식으로 된 html 소스 쓸때! -->
              <h3 v-html="TopScoreLabel"></h3>
            </b-col>
          </b-row>
        </b-container>
      </b-overlay>
    </b-card>
  </main>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import AnalysisFilter from '@/components/dashboard/AnalysisFilter.vue';
import DateFilter from '@/components/dashboard/DateFilter.vue';
import { Chart, registerables } from 'chart.js';
import randomColor from 'randomcolor';

interface ChartData {
  data: {
    [key: string]: Array<{
      variable: string; // 분석변수
      crym: number; // 구매 월
      buy: number; // 결제 금액
      count: number; // 구매자 수
    }>;
  };
  dates: Array<number>; // X축
  topLabel: Array<string>;
  topCountLabel: Array<string>;
}

interface IChartData {
  STORE_NAME?: number;
  GEN?: number;
  AGE?: number;
  DAY?: number;
  TIME?: number;
  BUY?: number;
  crym?: number | string;
  BUY_sum?: number;
  cnt_cno_sum?: number;
}

@Component({
  components: { AnalysisFilter, DateFilter },
})
export default class DashboardView extends Vue {
  //초기화 시켜주기
  private pending = false;
  private startDate: Date | null = null;
  private endDate: Date | null = null;
  private selectors: string[] = [];
  private firstOptions: number[] = [];
  private secondOptions: number[] = [];
  private chart?: Chart;
  private TopScoreLabel = '';
  private colorArray: string[] = [];
  chartOn = false;
  showDownloadBtn = false;

  // !sign: 해당위치 대신 전달하는 개념
  public $refs!: {
    chart: HTMLCanvasElement;
    analysis: any;
    date: any;
  };
  // 컴포넌트 기능 활용을 위해서 사용(?)
  constructor() {
    super();
  }

  // 바인딩한 데이터의 값이 존재하는 경우 function 실행
  private mounted() {
    if (
      (this.$route.query.startDate !== '') &
        (this.$route.query.endDate !== '') &&
      this.$route.query.selectors !== ''
    ) {
      this.selectorPush();
    }
  }

  //유효성 검사
  private get validateParams() {
    if (this.startDate === null) return false;
    if (this.endDate === null) return false;
    return this.selectors.length !== 0;
  }

  //getYear()로 사용할 경우 현재년도에서 1900뺀 년도가 나온다
  //getFullYear()은 웹표준이라 브라우저 상관없이 사용가능
  //getMonth 일의 자리일 경우 0 붙이기, 두자리일 경우에는 그대로 출력
  //getMonth()의 반환값이 0~11까지라 + 1 시켜줘야한다.
  //날짜를 문자열로 변환
  private dateToString(date: Date) {
    return (
      date.getFullYear() +
      '' +
      (Number(date.getMonth().toString()) + 1 < 10
        ? '0' + (Number(date.getMonth().toString()) + 1)
        : Number(date.getMonth().toString()) + 1)
    );
  }

  //선택값 보내는 역할
  private selectorPush() {
    this.$refs.date.chageDate(
      this.$route.query.startDate,
      this.$route.query.endDate,
    );
    this.$route.query.selectors
      .toString()
      .split(',')
      .forEach(item => {
        this.$refs.analysis.mainBtnClick(item);
      });
    if (this.$route.query.firstOptions !== '') {
      this.$route.query.firstOptions
        .toString()
        .split(',')
        .forEach(item => {
          this.$refs.analysis.subBtnClick(this.selectors[0], Number(item));
        });
    }
    if (this.$route.query.secondOptions !== '') {
      this.secondOptions = [];
      this.$route.query.secondOptions
        .toString()
        .split(',')
        .forEach(item => {
          this.$refs.analysis.subBtnClick(this.selectors[1], Number(item));
        });
    }
    this.search();
  }

  //검색버튼을 클릭할 경우(유효성 검사 실패시 error noti 뜨고 아닐경우 정보 넘겨서 검색)
  private clickSearch() {
    if (!this.validateParams) {
      this.$toast.error('분석 변수를 선택하세요');
      return;
    }
    const startDate = this.startDate ? this.dateToString(this.startDate) : '';
    const endDate = this.endDate ? this.dateToString(this.endDate) : '';
    const selectors = this.selectors.join(',');
    const firstOptions = this.firstOptions.join(',');
    const secondOptions = this.secondOptions.join(',');
    const queryValue: {
      startDate: string;
      endDate: string;
      selectors: string;
      firstOptions: string;
      secondOptions?: string;
    } = {
      startDate,
      endDate,
      selectors,
      firstOptions,
      secondOptions,
    };
    //router 중 chart에 저장한 query 보내기
    this.$router.push({
      name: 'chart',
      query: queryValue,
    });
    if (
      this.$route.query.startDate &&
      this.$route.query.endDate &&
      this.$route.query.selectors
    ) {
      this.search();
    }
  }

  private async search() {
    this.pending = true;

    try {
      const { data: response } = await this.axios.get<ChartData>(
        '/chart/chart-list',
        {
          params: {
            startDate: this.startDate,
            endDate: this.endDate,
            selectors: this.selectors,
            firstOptions: this.firstOptions,
            secondOptions: this.secondOptions,
          },
        },
      );
      this.drawChart(response);
    } catch (e) {
      console.log(e);
    } finally {
      this.pending = false;
    }
  }

  drawChart({ data, dates, topLabel, topCountLabel }: ChartData) {
    this.chartOn = true;
    const canvas = this.$refs.chart;
    const ctx = canvas.getContext('2d');
    this.TopScoreLabel = '';

    // 오류 처리
    if (!ctx) return;
    Chart.unregister(...registerables);
    Chart.register(...registerables);
    this.chart?.destroy();
    const entries = Object.entries(data);
    const datasets = entries.map(([key, value]) => {
      const color = randomColor();
      this.colorArray.push(color);
      return {
        label: key,
        data: value.map(v => v.buy),
        fill: false,
        tension: 0.1,
        borderColor: color,
        backgroundColor: color,
      };
    });

    this.TopScoreLabel = topLabel.join('');
    this.chart = new Chart(ctx, {
      type: 'line',
      //x축
      data: {
        labels: dates,
        datasets,
      },
      options: {
        scales: {
          x: {
            title: {
              display: true,
              text: '구매 월',
            },
            beginAtZero: true,
            ticks: {
              autoSkip: true,
              autoSkipPadding: 20,
            },
          },
          y: {
            title: {
              display: true,
              text: '결제 금액',
            },

            beginAtZero: true,
            ticks: {
              autoSkip: true,
              autoSkipPadding: 20,
            },
          },
        },
        plugins: {
          legend: {
            position: 'top',
            align: 'start',
            labels: {
              filter: (item, chart) => {
                return true;
              },
              padding: 20,
            },
          },
        },
      },
    });
  }

  private update({
    startDate,
    endDate,
    selectors,
    firstOptions,
    secondOptions,
  }: {
    startDate?: Date;
    endDate?: Date;
    selectors?: string[];
    firstOptions?: number[];
    secondOptions?: number[];
  }) {
    if (startDate) this.startDate = startDate;
    if (endDate) this.endDate = endDate;
    if (selectors) this.selectors = selectors;
    if (firstOptions) this.firstOptions = firstOptions;
    if (secondOptions) this.secondOptions = secondOptions;
  }

  private reset() {
    this.selectors = [];
    this.chartOn = false; // 입력시 차트가 보여지는 용도
  }

  async xlsxDownload() {
    if (!this.validateParams) {
      this.$toast.error('분석 변수를 선택하세요.');
      return;
    }
    const startDate = this.startDate;
    const endDate = this.endDate;
    const selectors = this.selectors;
    const firstOptions = this.firstOptions;
    const secondOptions = this.secondOptions;

    this.pending = true;
    try {
      const sendData = {
        startDate,
        endDate,
        selectors,
        firstOptions,
        secondOptions,
      };
      const data = await this.axios({
        url: '/chart/xlsx-down',
        method: 'GET',
        params: sendData,
        responseType: 'blob',
      }).then(response => {
        const href = URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = href;
        link.setAttribute('download', 'file.xlsx');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(href);
      });
    } catch (e) {
    } finally {
    }
  }
}
</script>

<style scoped>
main {
  height: 100vh;
}
</style>
