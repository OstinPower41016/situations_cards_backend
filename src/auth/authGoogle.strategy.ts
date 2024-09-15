import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { GoogleUserDto } from './dto/googleUser.dto';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID, // Полученные Client ID
      clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Полученные Client Secret
      callbackURL: 'http://localhost:3000/auth/google/callback',
      // callbackURL: 'https://oauth.pstmn.io/v1/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { emails } = profile;
    const user = new GoogleUserDto(emails[0].value);

    done(null, user);
  }
}
