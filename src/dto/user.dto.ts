import { User } from '@prisma/client';

export interface IUserUpdateDto extends Pick<User, 'nickname'> {}
