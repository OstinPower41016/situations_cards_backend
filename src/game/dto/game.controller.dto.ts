import { IsString, IsUUID } from 'class-validator';

export class CreateGameDto {
  @IsUUID()
  readonly roomId: string;
}
