import { UserEntity } from 'src/user/entities/user.entity';

export interface IUserUpdateDto
  extends Pick<UserEntity, 'nickname' | 'status'> {}
