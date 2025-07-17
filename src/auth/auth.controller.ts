import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, createUserSchema } from './dto/create-user.dto';
import { ZodValidationPipe } from '../pipes/validation.pipe';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginDto, loginSchema } from './dto/login.dto';
import {
  ForgotPasswordDto,
  forgotPasswordSchema,
} from './dto/forgot-password.dto';
import { VerifyOtpDto, verifyOtpSchema } from './dto/verify-otp.dto';
import {
  ResetPasswordDTO,
  resetPasswordSchema,
} from './dto/reset-password.dto';
import { GoogleGuard } from '../guards/google.guard';
import { Request, Response } from 'express';

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

  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(verifyOtpSchema))
  @Post('verify')
  async verify(@Body() verifyOtpDto: VerifyOtpDto) {
    return await this.authService._verifyOTP(verifyOtpDto);
  }

  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(loginSchema))
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return await this.authService._login(loginDto);
  }

  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(forgotPasswordSchema))
  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return await this.authService._forgotPassword(forgotPasswordDto);
  }

  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(resetPasswordSchema))
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDTO) {
    return await this.authService._resetPassword(resetPasswordDto);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(GoogleGuard)
  @Get('google')
  async googleAuth() {}

  @HttpCode(HttpStatus.OK)
  @UseGuards(GoogleGuard)
  @Get('google/callback')
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    if (!req.user || !('name' in req.user) || !('email' in req.user)) {
      throw new Error('Invalid user data from Google authentication');
    }
    const response = await this.authService.validateGoogleAuth(
      req.user as { name: string; email: string; password: '' },
    );
    res.redirect(`http://localhost:3000/auth/success?token=${response.token}`);
  }
}
