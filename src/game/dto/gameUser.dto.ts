import { IsArray, IsUUID } from 'class-validator';

export class GameUserDto {
  @IsUUID()
  id: string;

  @IsArray()
  questions: {
    id: string;
    description: string;
  }[];
}
