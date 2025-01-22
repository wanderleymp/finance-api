import { IsNumber, IsString, IsOptional, IsDate } from 'class-validator';

export class CreateContractAdjustmentHistoryDto {
    @IsNumber()
    contractId: number;

    @IsNumber()
    previousValue: number;

    @IsNumber()
    newValue: number;

    @IsOptional()
    @IsDate()
    changeDate?: Date;

    @IsString()
    changeType: string;

    @IsNumber()
    changedBy: number;
}
