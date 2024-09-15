import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { UserService } from 'src/user/user.service';
import { UserGuestCreateBody } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly userService: UserService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() response: Response) {
    const user = await this.userService.getOrCreateUserByEmail(req.user);
    response.cookie('_id', user.id, {
      httpOnly: true,
      secure: false,
    });

    response.json(user);
  }

  @Post('anonymous')
  async createGuest(
    @Req() req,
    @Res() response: Response,
    @Body() body: UserGuestCreateBody,
  ) {
    const user = await this.userService.createGuest(body);
    response.cookie('_id', user.id, {
      httpOnly: true,
      secure: false,
    });
    response.json(user);
  }
}
