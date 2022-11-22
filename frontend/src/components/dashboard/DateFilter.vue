<template>
  <section>
   <div class="d-flex align-items-center">
     <div class="d-flex">
       <div class="mx-1">기간</div>
       <div class="mx-1">
         <b-form-select
             v-model="startYear"
             :options="year"
             @change="changeDate"
         />
       </div>
       <div class="mx-1">년</div>
       <!-- 월 로직 마저 클론하기 -->
       <div class="mx-1">
         <b-form-select
             v-model="startMonth"
             :options="filterMonth(startYear)"
             @change="changeDate"
         />

       </div>
       <div class="mx-1">월</div>
     </div>
     <div class="mx-1"> ~ </div>
     <div class="d-flex">
       <div class="mx-1">기간</div>
       <div class="mx-1">
         <b-form-select
             v-model="endYear"
             :options="year"
             @change="changeDate"
         />
       </div>
       <div class="mx-1">년</div>
       <!-- 월 로직 마저 클론하기 -->
       <div class="mx-1">
         <b-form-select
             v-model="endMonth"
             :options="filterMonth(endYear)"
             @change="changeDate"
         />
       </div>
       <div class="mx-1">월</div>
     </div>
   </div>
  </section>
</template>

<script lang="ts">
import Vue from "vue";
import {Component} from "vue-property-decorator";

@Component({})
export default class DateFilter extends Vue {

  private get year () {
    return [
      { text: 2019 , value: 2019 },
      { text: 2020 , value: 2020 },
      { text: 2021 , value: 2021 },
      { text: 2022 , value: 2022 },
    ]
  }

  private get month () {
    return [
      {text: 1, value: 1 },
      {text: 2, value: 2 },
      {text: 3, value: 3 },
      {text: 4, value: 4 },
      {text: 5, value: 5 },
      {text: 6, value: 6 },
      {text: 7, value: 7, exceptYear: [ 2022 ] },
      {text: 8, value: 8, exceptYear: [ 2022 ] },
      {text: 9 , value: 9, exceptYear: [ 2022 ] },
      {text: 10, value: 10, exceptYear: [ 2022 ] },
      {text: 11 , value: 11, exceptYear: [ 2022 ] },
      {text: 12 , value: 12, exceptYear: [ 2022 ] },
    ];
  }

  private startYear = this.year[0].value; //2019년이 selectbox에 바로 보일수있도록
  private startMonth = this.month[0].value; //1월이 selectbox에 바로 보일수있도록

  private endYear = this.year[this.year.length - 1].value;
  private endMonth = this.month.filter(({ exceptYear }) => {
    return exceptYear ? !exceptYear.includes(this.endYear) : true; //endyear가 exceptYear에 포함되어있을경우 exceptYear 제외한 달만 입력
  }).reverse()[0].value; // 가장 끝에있는 value값 삽입

  //2022년 여부 -> 참일경우 exceptYear이 미 포함되어있는 달만 삽입
  private filterMonth(year: number){
    return this.month.filter(({ exceptYear }) => exceptYear ? !exceptYear.includes(year) : true )
  }

  private changeDate(){
    this.$emit('update', {
      startDate: new Date(this.startYear, this.startMonth - 1, 1),
      endDate: new Date(this.endYear, this.endMonth - 1, 1 ),
    });
  }


}
</script>

<style scoped>

</style>