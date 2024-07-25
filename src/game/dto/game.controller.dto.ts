import { IsString, IsUUID } from 'class-validator';

export class CreateGameBodyDto {
  @IsUUID()
  readonly roomId: string;
}

export class UpdateGameSelectQuestion {
  @IsUUID()
  readonly questionId: string;

  @IsUUID()
  readonly roomId: string;
}

export class GameSelectAnswerDto {
  @IsUUID()
  readonly answerId: string;

  @IsUUID()
  readonly roomId: string;
}

export class GameNextRoundDto {
  @IsUUID()
  readonly gameId: string;
}
