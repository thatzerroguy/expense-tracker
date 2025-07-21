import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {
  CanActivate,
  ConflictException,
  ExecutionContext,
  INestApplication,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as request from 'supertest';
import { Request } from 'express';
import { ZodIssue } from 'zod/v3';
import { GoogleGuard } from '../guards/google.guard';

@Injectable()
export class MockGoogleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    request.user = {
      name: 'Test User',
      email: 'test@email.com',
      password: '',
    };
    return true;
  }
}

describe('AuthController', () => {
  let controller: AuthController;
  let app: INestApplication;
  const mockAuthService = {
    _signup: jest.fn(),
    _login: jest.fn(),
    _verifyOTP: jest.fn(),
    _forgotPassword: jest.fn(),
    _resetPassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: GoogleGuard,
          useClass: MockGoogleGuard,
        },
      ],
    })
      .overrideProvider(GoogleGuard)
      .useClass(MockGoogleGuard)
      .compile();
    app = module.createNestApplication();
    await app.init();

    controller = module.get<AuthController>(AuthController);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /auth/signup', () => {
    it('should return 201 and user info on successful signup', async () => {
      const signupDto = {
        email: 'email@email.com',
        password: 'password',
        name: 'name',
      };

      mockAuthService._signup.mockResolvedValue({
        message: 'User successfully created',
        uuid: '123',
        token: 'mocked-token',
        otp: '123456',
        status: 201,
      });

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(signupDto)
        .expect(201);

      expect(response.body).toEqual({
        message: 'User successfully created',
        uuid: '123',
        token: 'mocked-token',
        otp: '123456',
        status: 201,
      });

      expect(mockAuthService._signup).toBeCalledWith(signupDto);
      expect(response.body).toHaveProperty('token');
    });

    it('should reject invalid input with 400', async () => {
      const signupDto = {
        email: 'invalid-email',
        password: 'short',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(signupDto);

      expect(response.status).toBe(400);

      const errors: ZodIssue[] = JSON.parse(response.body.error.message);
      const nameError = errors.find((e) => e.path.includes('name'));
      const emailError = errors.find((e) => e.path.includes('email'));

      expect(nameError).toBeDefined();
      expect(nameError?.message).toContain('expected string');

      expect(emailError).toBeDefined();
      expect(emailError?.message).toContain('Invalid email address');
    });

    it('should return CONFLICT for exist email', async () => {
      const signupDto = {
        email: 'email@email.com',
        password: 'password',
        name: 'name',
      };
      mockAuthService._signup.mockRejectedValue(
        new ConflictException('User with Email Exists'),
      );

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(signupDto)
        .expect(409);

      expect(response.body.message).toBe('User with Email Exists');
      expect(mockAuthService._signup).toBeCalledWith(signupDto);
      expect(response.status).toBe(409);
    });
  });

  describe('POST /auth/login', () => {
    it('should return 200 and user token and uuid', async () => {
      const loginDto = { email: 'email@email.com', password: 'password' };

      mockAuthService._login.mockResolvedValue({
        message: 'User logged in successfully',
        token: 'mocked-token',
        uuid: '123',
        status: 200,
      });

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      expect(mockAuthService._login).toBeCalledWith(loginDto);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('uuid');
    });

    it('should return UNAUTHORIZED for invalid password', async () => {
      const loginDto = { email: 'email@email.com', password: 'password' };
      mockAuthService._login.mockRejectedValue(
        new UnauthorizedException('Invalid password'),
      );
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
      expect(response.body.message).toBe('Invalid password');
    });

    it('should return NOT_FOUND if user doesnt exist', async () => {
      const loginDto = { email: 'email@email.com', password: 'password' };
      mockAuthService._login.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(404);
      expect(response.body.message).toBe('User not found');
    });

    it('should reject invalid input with 400', () => {
      //TODO: Implement Zod validation for verifyOtpDto
    });
  });

  describe('POST /auth/verify', () => {
    it('should return UNAUTHORIZED for invalid otp ', async () => {
      const verifyDto = { otp: '123456' };
      mockAuthService._verifyOTP.mockRejectedValue(
        new UnauthorizedException('Invalid OTP'),
      );
      const response: request.Response = await request(app.getHttpServer())
        .post('/auth/verify')
        .send(verifyDto)
        .expect(401);
      expect(response.body.message).toBe('Invalid OTP');
      expect(response.status).toBe(401);
    });

    it('should return OK if otp is valid', async () => {
      const verifyDto = { otp: '123456' };
      mockAuthService._verifyOTP.mockResolvedValue({
        message: 'OTP verified successfully',
        status: 200,
      });

      const response: request.Response = await request(app.getHttpServer())
        .post('/auth/verify')
        .send(verifyDto)
        .expect(200);

      expect(response.body.message).toBe('OTP verified successfully');
      expect(response.status).toBe(200);
    });

    it('should reject invalid input with 400', () => {
      //TODO: Implement Zod validation for verifyOtpDto
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('should return NOT_FOUND if email is not found', async () => {
      const forgotPasswordDto = { email: 'email@email.com' };
      mockAuthService._forgotPassword.mockRejectedValue(
        new NotFoundException('User not found'),
      );
      const response: request.Response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send(forgotPasswordDto)
        .expect(404);

      expect(response.body.message).toBe('User not found');
      expect(response.status).toBe(404);
    });
    it('should return OK if email is sent successfully', async () => {
      const forgotPasswordDto = { email: 'email@email.com' };
      mockAuthService._forgotPassword.mockResolvedValue({
        message: 'Reset password email sent successfully',
        status: 200,
      });

      const response: request.Response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send(forgotPasswordDto)
        .expect(200);

      expect(response.body.message).toBe(
        'Reset password email sent successfully',
      );
      expect(response.status).toBe(200);
    });
  });

  describe('POST /auth/reset-password', () => {
    it('should return NOT_FOUND if user is not found', async () => {
      const resetPasswordDto = {
        email: 'email@email.com',
        newPassword: 'password',
      };
      mockAuthService._resetPassword.mockRejectedValue(
        new NotFoundException('User not found'),
      );
      const response = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send(resetPasswordDto)
        .expect(404);

      expect(response.body.message).toBe('User not found');
      expect(mockAuthService._resetPassword).toBeCalledWith(resetPasswordDto);
      expect(response.status).toBe(404);
    });

    it('should return OK if password is reset successfully', async () => {
      const resetPasswordDto = {
        email: 'email@email.com',
        newPassword: 'password',
      };
      mockAuthService._resetPassword.mockResolvedValue({
        message: 'Reset password successfully',
        status: 200,
      });

      const response = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send(resetPasswordDto)
        .expect(200);

      expect(response.body.message).toBe('Reset password successfully');
      expect(mockAuthService._resetPassword).toBeCalledWith(resetPasswordDto);
      expect(response.status).toBe(200);
    });
  });

  describe('GET /auth/google', () => {
    it('should allow access to route /google', async () => {
      //TODO: Implement Google authentication mock
      //   const response = await request(app.getHttpServer())
      //     .get('/auth/google')
      //     .expect(200);
      //
      //   expect(response.status).toBe(200);
      //   expect(response.body.message).toBe('Google Auth triggered');
    });
    it('should call google-callback with user info and redirect', async () => {
      //TODO: Implement Google authentication mock
      //   const response = await request(app.getHttpServer())
      //     .get('/auth/google/callback')
      //     .expect(200);
    });
  });
});
