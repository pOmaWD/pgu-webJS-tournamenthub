import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class AddTeamDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name: string;

  @IsEmail()
  captainEmail: string;
}