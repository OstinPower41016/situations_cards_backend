import { Body, Controller, Get, Patch, Req, Res } from '@nestjs/common';
import { UserService } from './user.service';
import { Request, Response } from 'express';
import { IUserUpdateDto } from 'src/dto/user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getUserMe(@Req() request: Request, @Res() response: Response) {
    const user = await this.userService.getUserMe(request, response);
    response.json(user);
  }

  @Get('/generate-nickname')
  async generateNickname() {
    const nickname = await this.userService.generateUserNickName();
    return nickname;
  }

  @Patch('/me/update')
  async updateUserNickname(
    @Req() request: Request,
    @Res() response: Response,
    @Body() body: IUserUpdateDto,
  ) {
    const _id = request.cookies['_id'];
    const updatedUser = await this.userService.updateUser(_id, body as any);
    response.json(updatedUser);
  }
}
