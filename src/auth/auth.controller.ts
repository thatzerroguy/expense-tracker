import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UsePipes,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, createUserSchema } from './dto/create-user.dto';
import { ZodValidationPipe } from '../pipes/validation.pipe';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginDto, loginSchema } from './dto/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(createUserSchema))
  @Post('signup')
  @ApiResponse({
    status: HttpStatus.CREATED,
  })
  async signup(@Body() signupDto: CreateUserDto) {
    return await this.authService._signup(signupDto);
  }

  @Post('verify-email')
  async verifyEmail(@Body() otp: string) {
    return await this.authService._verifyOTP(otp);
  }

  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(loginSchema))
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return await this.authService._login(loginDto);
  }
}
