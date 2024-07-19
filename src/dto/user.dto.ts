import { IS_STRING, IsBoolean, IsString } from 'class-validator';

export class UserDto {
  @IsString()
  id: string;

  @IsString()
  nickname: string;

  password?: string;

  @IsBoolean()
  guest: boolean;
}

export class UserUpdateDto {
  @IsString()
  nickname: string;
}
