<template>
  <section class="border-right height-full">
    <div>
      <h6>분석 변수</h6>
      <hr/>
      <div class="select-bar">
        <ul>
          <li
              v-for="main in analysis"
              :key="main.value"
              class="main-menu"
          >
            <!-- value값 여부에 따라 class부여 -->
            <button
                class="main-button"
                :class = "getMainBtnActive(main.value)? 'main-button-active': 'main-button-inactive'"
                @click="mainBtnClick(main.value)"
            >  {{main.text}}
            </button>
            <!-- value값 있는 경우 -->
            <ul
              v-if="selected.indexOf(main.value)>=0"
            >
              <li
                v-for="sub in getSubList(main.value)"
                :key="sub.value"
                class="sub-menu"
              >
                <button
                  class="sub-button"
                  :class="getSubBtnActive(main.value, sub.value)? 'sub-button-active': 'sub-button-inactive'"
                  @click="subBtnClick(main.value, sub.value)"
                >
                  {{ sub.text }}
                </button>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>

    <div>
      <b-button
      class="common-btn reset-btn"
      @click="reset"
      >
        초기화
      </b-button>
    </div>


  </section>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import {Component} from "vue-property-decorator";

@Component
export default class AnalysisFilter extends Vue {
  private selected: string[] = [];
 /* private analysis: Array<{ value: string; text: string }> = [];*/
  private max = 2;
  private analysis = [
    { value: 'GEN', text: "구매자 성" },
    { value: 'AGE', text: "구매자 연령" },
    { value: 'STORE_NAME', text: "구매 지역" },
    { value: 'PRODUCT', text: "구매 상품 분류" },
    { value: 'DAY', text: "구매 요일" },
    { value: 'TIME', text: "구매 시간대" },
  ];
  private list_GEN = [
    {value: 1, text: "남"},
    {value: 2, text: "여"},
  ];
  private list_AGE = [
    {value: 2, text: "20대 이하"},
    {value: 3, text: "30대"},
    {value: 4, text: "40대"},
    {value: 5, text: "50대"},
    {value: 6, text: "60대"},
    {value: 7, text: "70대 이상"},
  ];
  private list_DAY = [
    {value: 1, text: "주중"},
    {value: 2, text: "주말"},
  ];
  private list_STORE_NAME = [
    {value: 1, text: "서울시 광진구 구의동"},
    {value: 2, text: "서울시 구로구 구로동"},
    {value: 3, text: "서울시 강북구 미아동"},
    {value: 4, text: "서울시 중구 봉래동"},
    {value: 5, text: "서울시 송파구 문정동"},
    {value: 6, text: "서울시 송파구 신천동"},
    {value: 7, text: "서울시 송파구 잠실동"},
    {value: 8, text: "서울시 동대문구 전농동"},
  ];
  private list_TIME = [
    {value: 1, text: "6시-12시"},
    {value: 2, text: "12시-18시"},
    {value: 3, text: "18시-24시"},
  ];
  private list_PRODUCT = [
    {value: 1, text: "과일및야채"},
    {value: 2, text: "기타"},
    {value: 3, text: "기타 식자재"},
    {value: 4, text: "기타 음료(냉장/과채/커피/차)"},
    {value: 5, text: "델리/음식점(일반/분식/치킨 등)"},
    {value: 6, text: "라면"},
    {value: 7, text: "문구/완구"},
    {value: 8, text: "미곡"},
    {value: 9, text: "반찬/장류/소스류"},
    {value: 10, text: "상온간편요리"},
    {value: 11, text: "생란"},
    {value: 12, text: "생수"},
    {value: 13, text: "수산물"},
    {value: 14, text: "스낵/비스켓/초콜릿/캔디/시리얼"},
    {value: 15, text: "요구르트"},
    {value: 16, text: "우유(흰우유/가공우유)"},
    {value: 17, text: "육류"},
    {value: 18, text: "일반의류"},
    {value: 19, text: "재사용/종량제"},
    {value: 20, text: "제과/가공베이커리/파이"},
    {value: 21, text: "주류(맥주/소주/와인/전통주)"},
    {value: 22, text: "주방/청소용품"},
    {value: 23, text: "치즈"},
    {value: 24, text: "탄산음료"},
    {value: 25, text: "햄/소시지/어묵/맛살"},
    {value: 26, text: "화장품"},
  ];

  private firstOptions: number[] = [];
  private secondOptions: number[] = [];

/*  created() {
    this.getAnalysis();
  }*/

  //분석변수 api 값 뽑아오기
/*  async getAnalysis() {
    const {data} = await axios.get("/api/chart/select-list");
    for (let i = 0; i < data.length; i++) {
      this.analysis.push({
        value: data[i].selectCode,
        text: data[i].selectName,
      });
      console.log(this.analysis)
    }
  }*/

  //분석 변수 별 서브메뉴 출력
  private getSubList(key: string){
    const realKey = `list_${key}`;
    console.log(this[realKey as keyof AnalysisFilter]);
    return this[realKey as keyof AnalysisFilter]
  }

  private mainBtnClick(main: string) {
    this.selected.push(main); // 배열에 선택한 main data 담기
    this.change(); //변경사항 체크및 반영
  }

  private getMainBtnActive(main: string) {
    if (this.selected.indexOf(main) >= 0) return true; //값이 선택되었을 경우
    else return false; // 값이 선택되지 않았을경우
  }

  private subBtnClick(main: string, sub: number) {
    if (this.selected.indexOf(main) === 1) { // 선택값이 두번째에 있을때
      if (this.secondOptions.indexOf(sub) >= 0) { // 두번째 서브값 존재할 경우
        const filtered = this.secondOptions.filter((item) => item !== sub); // 해당 서브 제외 아이템 filtering
        this.secondOptions = filtered; // 필터링 된 값 입력
      } else {
        this.secondOptions.push(sub); // 해당 서브값 입력
      }
    } else {
      if(this.firstOptions.indexOf(sub) >= 0){ // 첫번째 서브값 존재할 경우
        const filtered = this.firstOptions.filter((item) => item !== sub);
        this.firstOptions = filtered;
      }else{
        this.firstOptions.push(sub);
      }
    }
    this.subChange();
  }

  //서브메뉴 노출 조건 로직
  private getSubBtnActive(main:string, sub:number){
    if(this.selected.indexOf(main) === 1 && this.secondOptions.indexOf(sub) >= 0) return true; // 두번째 선택된 분석변수 와 두번째 서브메뉴가 값이 있을경우 true 반환
    else if(this.selected.indexOf(main) === 0 && this.firstOptions.indexOf(sub) >= 0) return true; // 첫번째 선택된 분석변수와 첫번째 서브메뉴가 값이 있을경우 true 반환
    else return false;
  }

  //분석변수 변경 event
  private change() {
    const existsPro = this.selected.includes('PRODUCT'); //'PRODUCT' value 값 포함하는 변수
    if (existsPro) {
      if (this.selected[0] === 'PRODUCT' && this.selected.length > 1) { // 2개선택 후 product 선택하는 경우? 선택되는것을 방지하는 차원
        this.selected = this.selected.filter((item) => item !== 'PRODUCT');
        this.firstOptions = this.secondOptions;
        this.secondOptions = [];
      } else {
        this.selected = ['PRODUCT'];
        this.firstOptions = [];
        this.secondOptions = [];
      }
    } else if (this.selected.length > this.max) {
      this.selected = this.selected.slice(-this.max); //배열의 마지막 두개 제외 삭제
      this.firstOptions = this.secondOptions;
      this.secondOptions = [];
    }

    if (this.selected.length > 1) { // 1개이상 선택시 저장할 데이터
      const sendData = {
        selectors: this.selected,
        firstOptions: this.firstOptions,
        secondOptions: this.secondOptions
      }
      this.$emit('update', sendData);
    } else {
      const sendData = { // 1개 선택시 저장할 데이터
        selectors: this.selected,
        firstOptions: this.firstOptions
      }
      this.$emit('update', sendData);
    }
  }


  //서브메뉴 변경 event
  private subChange(){
    if(this.selected.length > 1){
      const sendData = {
        selectors: this.selected,
        firstOptions: this.firstOptions,
        secondOptions: this.secondOptions
      }
      this.$emit('update', sendData);
    }else{
      const sendData = {
        selectors: this.selected,
        firstOptions: this.firstOptions,
      }
      this.$emit('update', sendData);
    }
  }

  private reset(){
    this.selected = [];
    this.firstOptions = [];
    this.secondOptions = [];
    this.$emit('reset'); // 상위 컴포넌트에 이벤트 보내기
  }

}

</script>

<style scoped>
.main-menu{
  margin: 0 auto;
  list-style: none;
  max-width: 170px;
  border: 1px solid rgba(0, 0, 0, 0.3);
  min-height: 32px;
  line-height: 32px;
  font-size: 13px;
  border-bottom: none;
}

ul{
  padding: 0px;
}

/* 양쪽 사이드 둥글게 처리 */
.main-menu:first-child{
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
}
.main-menu:last-child{
  border-bottom-right-radius: 4px;
  border-bottom-left-radius: 4px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.3);
}

/* 메인 버튼 배경 투명처리 */
.main-button{
  border: none;
  background-color: rgba(0,0,0,0);
  margin: 0 auto;
  width: 100%;
  height: 100%;
}

.main-button-inactive:hover{
  background-color: lightsteelblue;
  transition: 0.3s;
}

.main-button-inactive{
  background-color: white;
  transition: 0.3s;
}

.main-button-active{
  background-color: #2c3e50;
  border: 1px solid #2c3e50;
  transition: 0.3s;
  color: white;
}

.sub-menu{
  list-style: none;
  border:none;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.3);
}

.sub-menu:last-child{
  border-bottom: none;
}

.sub-button{
  border:none;
  background-color: white;
  margin: 0 auto;
  width: 100%;
  height: 100%;
  color: #2c3e50;
  font-size: 11px;
}

.sub-button-inactive:hover{
  background-color: lightsteelblue;
  transition: 0.3s;
}

.sub-button-inactive{
  background-color: white;
  transition: 0.3s;
}

.sub-button-active{
  background-color: lightsteelblue;
  transition: 0.3s;
}

.reset-btn{
  background-color: #2c3e50;
  font-size: small;
  min-height: 50px;
  min-width: 50px;
}


</style>