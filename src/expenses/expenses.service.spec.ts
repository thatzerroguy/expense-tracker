import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesService } from './expenses.service';
import { DatabaseService } from '../database/database.service';
import { UsersService } from '../users/users.service';
import { HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpenseTypeDto } from './dto/expense-type.dto';

describe('ExpensesService', () => {
  let service: ExpensesService;
  const mockDatabaseService = {
    $transaction: jest.fn(),
    expenses: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };
  const mockUserService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpensesService,
        { provide: DatabaseService, useValue: mockDatabaseService },
        { provide: UsersService, useValue: mockUserService },
      ],
    }).compile();

    service = module.get<ExpensesService>(ExpensesService);

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

  describe('create', () => {
    it('should return NOT_FOUND if user is not found ', async () => {
      const createExpenseDto: CreateExpenseDto = {
        amount: 100,
        description: 'Test Expense',
        expenseType: 'FOOD',
      };
      jest.spyOn(mockUserService, 'findOne').mockResolvedValue(null);

      await expect(
        service.create('nonexistent-user-id', createExpenseDto),
      ).rejects.toThrowError(
        new HttpException('No User Found', HttpStatus.NOT_FOUND),
      );
    });

    it('should return CREATED when task is created', async () => {
      const createExpenseDto: CreateExpenseDto = {
        amount: 100,
        description: 'Test Expense',
        expenseType: 'FOOD',
      };

      mockUserService.findOne.mockResolvedValue({ user: { id: 'user-id' } });

      mockDatabaseService.$transaction.mockImplementation((callback: any) =>
        callback({
          expenses: {
            create: jest.fn().mockResolvedValue({
              ...createExpenseDto,
              userId: 'user-id',
            }),
          },
        }),
      );

      const result = await service.create('user-id', createExpenseDto);

      expect(result).toEqual({
        message: 'Expense created successfully',
        data: result.data,
        uuid: 'user-id',
        status: HttpStatus.CREATED,
      });
    });
  });

  describe('findAll', () => {
    it('should return NOT_FOUND if no user found', async () => {
      const uuid: string = 'nonexistent-user-id';

      jest.spyOn(mockUserService, 'findOne').mockResolvedValue(null);

      await expect(service.findAll(uuid)).rejects.toThrowError(
        new HttpException('No User Found', HttpStatus.NOT_FOUND),
      );
    });

    it('should return FOUND and all expenses connected to the user', async () => {
      const uuid: string = 'user-id';
      const mockExpenses = [
        {
          id: '1',
          userId: uuid,
          amount: 100,
          description: 'Test Expense',
          expenseType: 'FOOD',
          date: new Date(),
          createdAt: new Date(),
        },
      ];
      mockUserService.findOne.mockResolvedValue({ user: { id: uuid } });

      jest
        .spyOn(mockDatabaseService.expenses, 'findMany')
        .mockResolvedValue(mockExpenses);

      const result = await service.findAll(uuid);

      expect(result).toEqual({
        message: 'Expenses for user found',
        expenses: result.expenses,
        status: HttpStatus.FOUND,
      });

      expect(mockDatabaseService.expenses.findMany).toHaveBeenCalledWith({
        where: { userId: uuid },
      });
    });

    it('should return NOT_FOUND if no expense was found of user', async () => {
      const uuid: string = 'user-id';
      mockUserService.findOne.mockResolvedValue({ user: { id: uuid } });

      jest
        .spyOn(mockDatabaseService.expenses, 'findMany')
        .mockResolvedValue([]);

      await expect(service.findAll(uuid)).rejects.toThrowError(
        new HttpException('No Expenses Found for User', HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('findOne', () => {
    it('should return NOT_FOUND if no expense with uuid was found', async () => {
      jest
        .spyOn(mockDatabaseService.expenses, 'findUnique')
        .mockResolvedValue(null);

      await expect(
        service.findOne('nonexistent-expense-id'),
      ).rejects.toThrowError(
        new HttpException('No Expense Found', HttpStatus.NOT_FOUND),
      );
    });

    it('should return FOUND with expense data found', async () => {
      const uuid: string = 'user-id';
      const expenseId: string = 'expense-id';
      const mockExpense = {
        id: expenseId,
        userId: uuid,
        description: 'Test Expense',
        amount: 100,
        expenseType: 'FOOD',
        date: new Date(),
        createdAt: new Date(),
      };

      jest
        .spyOn(mockDatabaseService.expenses, 'findUnique')
        .mockResolvedValue(mockExpense);

      const result = await service.findOne(expenseId);

      expect(result).toEqual({
        message: 'Expense found',
        data: mockExpense,
        status: HttpStatus.FOUND,
      });
    });
  });

  describe('update', () => {
    it('should return NOT_FOUND if task is not found', async () => {
      const uuid: string = 'user-id';
      const updateExpenseDto: UpdateExpenseDto = {
        amount: 100,
        description: 'Test Expense',
        expenseType: 'FOOD',
      };
      jest
        .spyOn(mockDatabaseService.expenses, 'findUnique')
        .mockResolvedValue(null);

      await expect(service.update(uuid, updateExpenseDto)).rejects.toThrowError(
        new HttpException('No Expense Found', HttpStatus.NOT_FOUND),
      );
    });
    it('should return FOUND and task', async () => {
      const uuid: string = 'user-id';
      const expenseId: string = 'expense-id';
      const updateExpenseDto: UpdateExpenseDto = {
        description: 'Test Expense',
        expenseType: 'HEALTHCARE',
      };
      const mockExpense = {
        id: expenseId,
        userId: uuid,
        description: 'Test Expense',
        amount: 100,
        expenseType: 'HEALTHCARE',
      };

      mockDatabaseService.$transaction.mockImplementation((callback: any) =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
        callback({
          expenses: {
            findUnique: jest.fn().mockResolvedValue(mockExpense),
            update: jest.fn().mockResolvedValue({
              ...mockExpense,
              userId: uuid,
            }),
          },
        }),
      );

      const result = await service.update(uuid, updateExpenseDto);

      expect(result).toEqual({
        message: 'Expense updated successfully',
        data: result.data,
        uuid: 'user-id',
        status: HttpStatus.ACCEPTED,
      });
    });
  });

  describe('getTotalExpenses', () => {
    it('should return NOT_FOUND if user is not found', async () => {
      const uuid: string = 'nonexistent-user-id';

      jest.spyOn(mockUserService, 'findOne').mockResolvedValue(null);

      await expect(service.getTotalExpenses(uuid)).rejects.toThrowError(
        new NotFoundException('No User Found'),
      );
    });

    it('should return uuid and amount of total expenses', async () => {
      const uuid: string = 'user-id';
      const mockExpenses = [{ amount: 100 }, { amount: 200 }, { amount: 300 }];
      const totalAmount = mockExpenses.reduce(
        (sum, expense) => sum + expense.amount,
        0,
      );

      mockUserService.findOne.mockResolvedValue({ user: { id: uuid } });
      jest
        .spyOn(mockDatabaseService.expenses, 'findMany')
        .mockResolvedValue(mockExpenses);

      const result = await service.getTotalExpenses(uuid);

      expect(result).toEqual({
        uuid,
        totalAmount,
      });
    });
  });

  describe('totalExpenseByType', () => {
    it('should return NOT_FOUND if user is not found', async () => {
      const uuid: string = 'user-id';
      const expenseType: ExpenseTypeDto = { expenseType: 'FOOD' };

      jest.spyOn(mockUserService, 'findOne').mockResolvedValue(null);

      await expect(
        service.getTotalExpensesByType(uuid, expenseType),
      ).rejects.toThrowError(new NotFoundException('No User Found'));
    });
    it('should return total expense for type and uuid', async () => {
      const uuid: string = 'user-id';
      const expenseType: ExpenseTypeDto = { expenseType: 'FOOD' };
      const mockExpenses = [
        { amount: 100, expenseType: 'FOOD' },
        { amount: 200, expenseType: 'FOOD' },
        { amount: 300, expenseType: 'FOOD' },
      ];

      mockUserService.findOne.mockResolvedValue({ user: { id: uuid } });
      jest
        .spyOn(mockDatabaseService.expenses, 'findMany')
        .mockResolvedValue(mockExpenses);

      const result = await service.getTotalExpensesByType(uuid, expenseType);
      const foodExpenses = mockExpenses.filter(
        (expense) => expense.expenseType === 'FOOD',
      );
      const totalFoodAmount = foodExpenses.reduce(
        (sum, expense) => sum + expense.amount,
        0,
      );
      expect(result).toEqual({
        uuid,
        expenseType: 'FOOD',
        totalAmount: totalFoodAmount,
      });
    });
  });
});
