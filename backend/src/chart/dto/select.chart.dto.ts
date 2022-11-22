import {IsArray, IsNumber, IsString} from "class-validator";

export class SelectChartDto{

    @IsString()
    readonly selectCode: string;

    @IsNumber()
    readonly selector: number;

    @IsString()
    readonly selectorName : string;

}