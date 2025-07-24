import { Test, TestingModule } from '@nestjs/testing';
import { IncomeService } from './income.service';
import { UsersService } from '../users/users.service';
import { DatabaseService } from '../database/database.service';
import { HttpStatus, NotFoundException } from '@nestjs/common';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { RecurIncomeDto } from './dto/recur-income.dto';

describe('IncomeService', () => {
  let service: IncomeService;
  const mockUserService = {
    findOne: jest.fn(),
  };
  const mockDatabaseService = {
    $transaction: jest.fn(),
    income: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncomeService,
        {
          provide: UsersService,
          useValue: mockUserService,
        },
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<IncomeService>(IncomeService);

    // Mock the $transaction method to return a resolved promise
    mockDatabaseService.$transaction.mockImplementation(
      async (callback: any) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-call
        return await callback(mockDatabaseService);
      },
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  it('should be defined', () => {
    expect(mockDatabaseService).toBeDefined();
  });
  it('should be defined', () => {
    expect(mockUserService).toBeDefined();
  });

  describe('create', () => {
    it('should return NOT_FOUND if no user is found', async () => {
      const uuid = 'nonexistent-user-id';
      const mockIncomeDto: CreateIncomeDto = {
        amount: 10000,
        source: 'Work',
      };

      mockUserService.findOne.mockResolvedValue(null);

      await expect(service.create(uuid, mockIncomeDto)).rejects.toThrowError(
        new NotFoundException(`User with id ${uuid} not found`),
      );
    });

    it('should return CREATED when income has been created ', async () => {
      const uuid = 'user-id';
      const mockIncomeDto: CreateIncomeDto = {
        amount: 10000,
        source: 'Work',
      };

      const mockIncome = {
        id: '123',
        userId: uuid,
        ...mockIncomeDto,
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserService.findOne.mockResolvedValue({ user: { id: uuid } });

      mockDatabaseService.$transaction.mockImplementation((callback: any) =>
        callback({
          income: {
            create: jest.fn().mockResolvedValue({
              ...mockIncomeDto,
              userId: uuid,
            }),
          },
        }),
      );

      const result = await service.create(uuid, mockIncomeDto);
      expect(result).toEqual({
        message: 'Income logged successfully.',
        data: result.data,
        status: HttpStatus.CREATED,
      });
    });
  });

  describe('findAll', () => {
    it('should return NOT_FOUND if no user if found', async () => {
      const uuid = 'non-existent-user-id';

      mockUserService.findOne.mockResolvedValue(null);

      await expect(service.findAll(uuid)).rejects.toThrowError(
        new NotFoundException(`User not found`),
      );
    });

    it('should return NOT_FOUND if user is found but has no income log', async () => {
      const uuid = 'user-id';

      mockUserService.findOne.mockResolvedValue({ user: { id: uuid } });

      jest.spyOn(mockDatabaseService.income, 'findMany').mockResolvedValue([]);

      await expect(service.findAll(uuid)).rejects.toThrowError(
        new NotFoundException(`No income logs found for user with id ${uuid}.`),
      );
    });

    it('should return FOUND with uuid and all user income logs', async () => {
      const uuid = 'user-id';
      const mockIncome = {
        source: 'Work',
        amount: 10000,
        id: 'income-id',
        userId: uuid,
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest
        .spyOn(mockDatabaseService.income, 'findMany')
        .mockResolvedValue(mockIncome);

      const result = await service.findAll(uuid);

      expect(result).toEqual({
        message: 'Income logs found successfully',
        data: mockIncome,
        status: HttpStatus.FOUND,
      });
    });
  });

  describe('findOne', () => {
    it('should return NOT_FOUND if income log is not found', async () => {
      const incomeId = 'income-id';

      jest
        .spyOn(mockDatabaseService.income, 'findUnique')
        .mockResolvedValue(null);

      await expect(service.findOne(incomeId)).rejects.toThrowError(
        new NotFoundException('No income with id found.'),
      );
    });

    it('should return found and income details', async () => {
      const incomeId = 'income-id';
      const mockIncome = {
        source: 'Work',
        amount: 10000,
        id: 'income-id',
        userId: incomeId,
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest
        .spyOn(mockDatabaseService.income, 'findUnique')
        .mockResolvedValue(mockIncome);

      const result = await service.findOne(incomeId);

      expect(result).toEqual({
        message: 'Income details found successfully.',
        data: result.data,
        status: HttpStatus.FOUND,
      });
    });
  });

  describe('update', () => {
    it('should return NOT_FOUND if user is not found', async () => {
      const uuid = 'non-existent-expense-id';
      const updateIncomeDto: UpdateIncomeDto = {
        source: 'Work',
      };

      jest
        .spyOn(mockDatabaseService.income, 'findUnique')
        .mockResolvedValue(null);

      await expect(service.update(uuid, updateIncomeDto)).rejects.toThrowError(
        new NotFoundException(`No Income Found`),
      );
    });

    it('should return ACCEPTED with updated income logs', async () => {
      const uuid = 'income-id';
      const updateIncomeDto: UpdateIncomeDto = {
        source: 'Work',
      };

      const mockIncome = {
        source: 'Work',
        amount: 10000,
        id: uuid,
        userId: 'income-id',
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDatabaseService.$transaction.mockImplementation((callback: any) =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
        callback({
          income: {
            findUnique: jest.fn().mockResolvedValue(mockIncome),
            update: jest.fn().mockResolvedValue({
              ...mockIncome,
              userId: 'user-id',
            }),
          },
        }),
      );

      const result = await service.update(uuid, updateIncomeDto);

      expect(result).toEqual({
        message: 'Income log updated successfully.',
        data: result.data,
        uuid: uuid,
        status: HttpStatus.ACCEPTED,
      });
    });
  });

  describe('CreateRecurringIncome', () => {
    it('should return NOT_FOUND if user is not found', async () => {
      const uuid = 'non-existent-expense-id';
      const recurIncomeDto: RecurIncomeDto = {
        source: 'Work',
        amount: 10000,
        frequency: 'MONTHLY',
        interval: 1,
        startDate: new Date(),
      };

      mockUserService.findOne.mockResolvedValue(null);

      await expect(
        service.createRecurringIncome(uuid, recurIncomeDto),
      ).rejects.toThrowError(new NotFoundException('No user with id found.'));
    });

    it('should return CREATED when recurring income details has been created', async () => {
      const uuid = 'non-existent-expense-id';
      const recurIncomeDto: RecurIncomeDto = {
        source: 'Work',
        amount: 10000,
        frequency: 'MONTHLY',
        interval: 1,
        startDate: new Date(),
      };

      mockUserService.findOne.mockResolvedValue({ user: { id: uuid } });

      mockDatabaseService.$transaction.mockImplementation((callbacck: any) =>
        callbacck({
          recurringIncome: {
            create: jest.fn().mockResolvedValue({
              ...recurIncomeDto,
              userId: uuid,
            }),
          },
        }),
      );

      const result = await service.createRecurringIncome(uuid, recurIncomeDto);

      expect(result).toEqual({
        message: 'Recurring Income details created successfully.',
        data: result.data,
        status: HttpStatus.CREATED,
      });
    });
  });
});
