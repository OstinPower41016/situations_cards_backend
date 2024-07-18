export class UserDto {
  id: string;
  nickname: string;
  password?: string;
  guest: boolean;
}

export class UserUpdateDto {
  nickname?: string;
}
