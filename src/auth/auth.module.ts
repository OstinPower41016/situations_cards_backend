import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './authGoogle.strategy';
import { UserService } from 'src/user/user.service';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [PassportModule.register({ session: true }), UserModule],
  controllers: [AuthController],
  providers: [GoogleStrategy],
})
export class AuthModule {}
