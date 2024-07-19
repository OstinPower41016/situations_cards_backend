import {
  IsString,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

// Определяем перечисление для статуса
export enum RoomStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export class RoomCreateDto {
  @IsString()
  name: string;

  @IsBoolean()
  private: boolean;
}

export class RoomDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsBoolean()
  private: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => String)
  participants: string[];

  @IsEnum(RoomStatus)
  status: RoomStatus;
}
