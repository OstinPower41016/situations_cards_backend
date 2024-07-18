import { Body, Controller, Get, Patch, Req, Res } from '@nestjs/common';
import { UserService } from './user.service';
import { Request, Response } from 'express';
import { UserUpdateDto } from 'src/dto/user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getUserMe(@Req() request: Request, @Res() response: Response) {
    const user = await this.userService.getUserMe(request, response);
    response.json(user);
  }

  @Patch('/me/update')
  async updateUserNickname(
    @Req() request: Request,
    @Res() response: Response,
    @Body() body: UserUpdateDto,
  ) {
    const updatedUser = await this.userService.updateUser(request, body);
    response.json(updatedUser);
  }
}
