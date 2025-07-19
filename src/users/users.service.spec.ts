import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { DatabaseService } from '../database/database.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  const databaseServiceMock = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: DatabaseService, useValue: databaseServiceMock },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return NOT_FOUND is no user is found', async () => {
      jest.spyOn(databaseServiceMock.user, 'findMany').mockResolvedValue([]);

      await expect(service.findAll()).rejects.toThrowError(
        new HttpException('No User Found', HttpStatus.NOT_FOUND),
      );
    });

    it('should return FOUND if any user is found', async () => {
      const mockUsers = [{ id: '1', email: 'test@example.com' }];
      jest
        .spyOn(databaseServiceMock.user, 'findMany')
        .mockResolvedValue(mockUsers);

      const result = await service.findAll();

      expect(result).toEqual({
        message: 'Users found',
        data: mockUsers,
        status: 302,
      });
    });
  });

  describe('findOne', () => {
    it('should NOT_FOUND if no user is found', async () => {
      jest
        .spyOn(databaseServiceMock.user, 'findUnique')
        .mockResolvedValue(null);

      await expect(service.findOne('non-existent-uuid')).rejects.toThrowError(
        new HttpException('No User Found', HttpStatus.NOT_FOUND),
      );
    });

    it('should return FOUND if user is found', async () => {
      const mockUser = { uuid: '123', email: 'test@example.com' };

      jest
        .spyOn(databaseServiceMock.user, 'findUnique')
        .mockResolvedValue(mockUser);

      const result = await service.findOne('123');

      expect(result).toEqual({
        message: 'User found',
        user: mockUser,
        status: HttpStatus.FOUND,
      });
    });
  });

  describe('getByEmail', () => {});
});
