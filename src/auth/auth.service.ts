import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { DatabaseService } from '../database/database.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  private readonly logger: Logger;
  constructor(
    private readonly userService: UsersService,
    private readonly databaseService: DatabaseService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
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
      await this.mail.sendWelcomeEmail(
        'Welcome to Our Service',
        user.email,
        'noreply@email.com',
        'welcome-email',
        { name: user.name },
      );

      return {
        message: 'User successfully created',
        uuid: user.id,
        token: token,
        status: HttpStatus.CREATED,
      };
    });
  }
}
