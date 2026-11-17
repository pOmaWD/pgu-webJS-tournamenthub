import { ArrayMaxSize, ArrayMinSize, IsArray, IsMongoId } from 'class-validator';

export class ScheduleDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsMongoId({ each: true })
  refereeIds: string[];
}