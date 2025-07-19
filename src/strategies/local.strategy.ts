import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth/auth.service';
import { LoginDto } from '../auth/dto/login.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly auth: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string) {
    const loginDto = { email, password } as LoginDto;
    if (loginDto.password === '') {
      throw new HttpException(
        'Password cannot be empty',
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = await this.auth._login(loginDto);
    if (!user) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    return user;
  }
}
