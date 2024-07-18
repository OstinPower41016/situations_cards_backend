import { IsString, IsBoolean } from 'class-validator';

export class RoomCreateDto {
  @IsString()
  name: string;

  @IsBoolean()
  private: boolean;
}

export class RoomDto {
  id: string;
  name: string;
  private: boolean;
  participants: string[];
}
