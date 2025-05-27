import { IsString, IsNotEmpty } from 'class-validator';

export class EventDto {
  @IsString()
  @IsNotEmpty()
  message: string;
}
