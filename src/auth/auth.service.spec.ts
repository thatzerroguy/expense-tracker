import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { DatabaseService } from '../database/database.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;
  const mockDatabaseService = {
    $transaction: jest.fn(),
  };
  const mockUserService = {
    getByEmail: jest.fn(),
  };
  const mockJwtService = {
    sign: jest.fn(() => 'mocked-token'),
  };
  const mockMailService = {
    sendMail: jest.fn(),
  };
  const mockCache = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUserService,
        },
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
        {
          provide: 'CACHE_MANAGER',
          useValue: mockCache,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('_signup', () => {
    it('should create a new user and return otp and token', async () => {
      const signupDto = {
        email: 'test@email.com',
        password: 'password',
        name: 'Test User',
      };
      const createdUser = {
        id: '123',
        email: signupDto.email,
        name: signupDto.name,
      };

      mockDatabaseService.$transaction.mockImplementation((cb) =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
        cb({
          user: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue(createdUser),
          },
        }),
      );

      jest
        .spyOn(bcrypt, 'hash')
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        .mockImplementation(() => Promise.resolve('hashedPassword' as string));
      jest.spyOn(service as any, '_generateOTP').mockResolvedValue('123456');

      const result = await service._signup(signupDto);

      expect(result).toEqual({
        message: 'User successfully created',
        uuid: '123',
        token: 'mocked-token',
        otp: '123456',
        status: 201,
      });
    });
    it('should throw CONFLICT if user already exists', async () => {
      const signupDto = {
        email: 'test@email.com',
        password: 'password',
        name: 'Test User',
      };
      const existingUser = {
        id: '123',
        email: signupDto.email,
      };

      mockDatabaseService.$transaction.mockImplementation((callback: any) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-call
        return callback({
          user: {
            findUnique: jest.fn().mockResolvedValue(existingUser),
          },
        });
      });

      await expect(service._signup(signupDto)).rejects.toThrow(
        'User with Email Exists',
      );
    });
  });

  describe('_login', () => {
    it('should throw NOT_FOUND if user is not found', async () => {
      const loginDto = {
        email: 'test@email.com',
        password: 'password',
      };
      mockUserService.getByEmail.mockResolvedValue(null);
      await expect(service._login(loginDto)).rejects.toThrow('User not found');
    });

    it('should throw UNAUTHORIZED if passwords do not match', async () => {
      const loginDto = {
        email: 'test@email.com',
        password: 'password',
      };
      const existingUser = {
        id: '123',
        email: loginDto.email,
        password: 'hashedPassword',
      };

      mockUserService.getByEmail.mockResolvedValue(existingUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
      await expect(service._login(loginDto)).rejects.toThrow(
        'Invalid password',
      );
    });

    it('should return token and uuid if login is successful', async () => {
      const loginDto = {
        email: 'test@email.com',
        password: 'password',
      };
      const existingUser = {
        id: '123',
        email: loginDto.email,
        password: 'hashedPassword',
      };

      mockUserService.getByEmail.mockResolvedValue(existingUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service._login(loginDto);

      expect(result).toEqual({
        message: 'User logged in successfully',
        token: 'mocked-token',
        uuid: '123',
        status: 200,
      });
    });
  });

  describe('_generateOTP', () => {
    it('should return generated otp', async () => {
      const otp = await service._generateOTP();
      expect(otp).toHaveLength(6);
      expect(Number(otp)).toBeGreaterThanOrEqual(100000);
      expect(Number(otp)).toBeLessThanOrEqual(999999);
    });
  });

  describe('_verifyOTP', () => {
    it('should return OK if otp has been verified successfully', async () => {
      const verifyOtpDto = { otp: '123456' };
      mockCache.get.mockResolvedValue('123456');
      mockCache.del.mockResolvedValue(undefined);
      await expect(service._verifyOTP(verifyOtpDto)).resolves.toEqual({
        message: 'OTP verified successfully',
        status: 200,
      });
    });

    it('should return UNAUTHORIZED if otp is not verified successfully', async () => {
      const verifyOtpDto = { otp: '123456' };
      mockCache.get.mockResolvedValue('654321');
      await expect(service._verifyOTP(verifyOtpDto)).rejects.toThrow(
        'OTP verification failed',
      );
    });
  });

  describe('_forgotPassword', () => {
    it('should return NOT_FOUND if user does not exist', async () => {
      const forgotPasswordDto = { email: 'test@email.com' };
      mockUserService.getByEmail.mockResolvedValue(null);
      await expect(service._forgotPassword(forgotPasswordDto)).rejects.toThrow(
        'User not found',
      );
    });

    it('should return OK if password mail and otp was sent', async () => {
      const forgotPasswordDto = { email: 'test@email.com' };
      const existingUser = {
        id: '123',
        name: 'Test User',
        email: forgotPasswordDto.email,
      };

      mockUserService.getByEmail.mockResolvedValue(existingUser);
      mockCache.set.mockResolvedValue(undefined);
      jest.spyOn(service as any, '_generateOTP').mockResolvedValue('123456');
      mockMailService.sendMail.mockResolvedValue(undefined);

      await expect(service._forgotPassword(forgotPasswordDto)).resolves.toEqual(
        {
          message: 'Reset password email sent successfully',
          status: 200,
        },
      );

      expect(mockMailService.sendMail).toHaveBeenCalledWith(
        'Reset Password Request',
        existingUser.email,
        'noreply@support.horizon',
        'forgot-password-email',
        { name: existingUser.name, otp: '123456' },
      );
    });
  });

  describe('_resetPassword', () => {
    it('should throw NOT_FOUND if user is not found', async () => {
      const resetPasswordDto = {
        email: 'test@email.com',
        password: 'password',
      };
      mockUserService.getByEmail.mockResolvedValue(null);
      await expect(service._login(resetPasswordDto)).rejects.toThrow(
        'User not found',
      );
    });

    it('should return OK if password was updated successfully', async () => {
      const resetPasswordDto = {
        email: 'test@email.com',
        newPassword: 'password',
      };
      const existingUser = {
        id: '123',
        email: resetPasswordDto.email,
        password: 'hashedPassword',
      };
      mockUserService.getByEmail.mockResolvedValue(existingUser);
      mockDatabaseService.$transaction.mockImplementation((cb) =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
        cb({
          user: {
            update: jest.fn().mockResolvedValue({
              ...existingUser,
              password: 'newHashedPassword',
            }),
          },
        }),
      );
      jest
        .spyOn(bcrypt, 'hash')
        .mockResolvedValue('newHashedPassword' as never);
      await expect(service._resetPassword(resetPasswordDto)).resolves.toEqual({
        message: 'Reset password successfully',
        status: 200,
      });
    });
  });
});
