import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { DatabaseService } from '../database/database.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDTO } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  private readonly logger: Logger;
  constructor(
    private readonly userService: UsersService,
    private readonly databaseService: DatabaseService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.logger = new Logger(AuthService.name);
  }

  async _signup(signupDto: CreateUserDto) {
    return this.databaseService.$transaction(async (tx) => {
      // Check if user already exists
      const existingUser = await tx.user.findUnique({
        where: { email: signupDto.email },
      });
      if (existingUser) {
        throw new HttpException('User with Email Exists', HttpStatus.CONFLICT);
      }

      // Hash password
      signupDto.password = await bcrypt.hash(signupDto.password, 10);

      // Create user
      const user = await tx.user.create({ data: signupDto });

      // Generate JWT token
      const payload = { sub: user.id, email: user.email };
      const token = this.jwt.sign(payload);

      // Send welcome email (optional, can be implemented later)
      await this.mail.sendMail(
        'Welcome to Our Service',
        user.email,
        'noreply@email.com',
        'welcome-email',
        { name: user.name },
      );

      const otp = await this._generateOTP();

      return {
        message: 'User successfully created',
        uuid: user.id,
        token: token,
        otp: otp,
        status: HttpStatus.CREATED,
      };
    });
  }

  async _generateOTP() {
    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in cache
    await this.cacheManager.set('otp', otp);

    return otp;
  }

  async _verifyOTP(verifyOtpDto: VerifyOtpDto) {
    //TODO: Fix verification to check which email the OTP is for
    try {
      // Get OTP from cache
      const cachedOtp = await this.cacheManager.get<string>('otp');

      // compare the provided OTP with the cached OTP
      if (cachedOtp && cachedOtp === verifyOtpDto.otp) {
        // OTP is valid, remove it from cache
        await this.cacheManager.del('otp');
        return { message: 'OTP verified successfully', status: HttpStatus.OK };
      } else {
        throw new HttpException('Invalid OTP', HttpStatus.UNAUTHORIZED);
      }
    } catch (error) {
      this.logger.error('Error verifying OTP', error);
      throw new HttpException(
        'OTP verification failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async _login(loginDto: LoginDto) {
    try {
      // Check if email exists
      const user = await this.userService.getByEmail(loginDto.email);
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // Compare passwords
      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        user.password,
      );
      if (!isPasswordValid) {
        throw new HttpException('Invalid password', HttpStatus.UNAUTHORIZED);
      }

      // Generate JWT token
      const token = this._generateToken({ sub: user.id, email: user.email });

      return {
        message: 'User logged in successfully',
        token: token,
        uuid: user.id,
        status: HttpStatus.OK,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('User login failed', error);
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  _generateToken(payload: { sub: string; email: string }) {
    return this.jwt.sign(payload);
  }

  async _forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    try {
      // Check if email exists
      const user = await this.userService.getByEmail(forgotPasswordDto.email);
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // Generate a reset token
      const otp = await this._generateOTP();

      // Send reset password email
      await this.mail.sendMail(
        'Reset Password Request',
        user.email,
        'noreply@support.horizon',
        'forgot-password-email',
        { name: user.name, otp },
      );

      return {
        message: 'Reset password email sent successfully',
        status: HttpStatus.OK,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('ForgotPassword failed', error);
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async _resetPassword(resetPasswordDto: ResetPasswordDTO) {
    return this.databaseService.$transaction(async (tx) => {
      // Check if user with email exists
      const existingUser = await this.userService.getByEmail(
        resetPasswordDto.email,
      );
      if (!existingUser) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(
        resetPasswordDto.newPassword,
        10,
      );

      // Update user's password
      await tx.user.update({
        where: { email: existingUser.email },
        data: { password: hashedPassword },
      });

      return {
        message: 'Reset password successfully',
        status: HttpStatus.OK,
      };
    });
  }

  async validateGoogleAuth(createUserDto: CreateUserDto) {
    return this.databaseService.$transaction(async (tx) => {
      // Check if user already exists and return if found
      const existingUser = await tx.user.findUnique({
        where: { email: createUserDto.email },
      });
      if (existingUser) {
        const payload = { sub: existingUser.id, email: existingUser.email };
        const token = this._generateToken(payload);
        return {
          message: 'User already exists',
          uuid: existingUser.id,
          token: token,
          status: HttpStatus.OK,
        };
      }

      // If user does not exist, create a new user
      const user = await tx.user.create({ data: createUserDto });
      const payload = { sub: user.id, email: user.email };
      const token = this._generateToken(payload);
      return {
        message: 'User successfully created',
        uuid: user.id,
        token: token,
        status: HttpStatus.CREATED,
      };
    });
  }
}
