import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import {
  HttpStatus,
  INestApplication,
  NotFoundException,
} from '@nestjs/common';
import { JwtGuard } from '../guards/jwt.guard';
import * as request from 'supertest';
import { UsersService } from '../users/users.service';
import { DatabaseService } from '../database/database.service';

class MockJWTGuard {
  canActivate() {
    return true;
  }
}

describe('ExpensesController', () => {
  let controller: ExpensesController;
  let app: INestApplication;
  const mockExpensesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockUserService = {
    findOne: jest.fn(),
  };

  const mockDatabaseService = {
    expenses: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExpensesController],
      providers: [
        ExpensesService,
        { provide: ExpensesService, useValue: mockExpensesService },
        { provide: UsersService, useValue: mockUserService },
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    })
      .overrideGuard(JwtGuard)
      .useClass(MockJWTGuard)
      .compile();

    app = module.createNestApplication();
    await app.init();
    controller = module.get<ExpensesController>(ExpensesController);
  });

  afterAll(async () => {
    await app.close();
  });
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should return CREATED and task created', async () => {
      const uuid = 'bdf39d61-6e7b-4207-9094-d2ef6c37f6cb';
      const createExpenseDto = {
        amount: 100,
        description: 'Test',
        expenseType: 'FOOD',
      };

      const mockExpense = {
        id: '1',
        userId: uuid,
        amount: createExpenseDto.amount,
        description: createExpenseDto.description,
        expenseType: createExpenseDto.expenseType,
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockExpensesService.create.mockResolvedValue({
        message: 'Expense created successfully',
        data: mockExpense,
        uuid,
        status: HttpStatus.CREATED,
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const response = await request(app.getHttpServer())
        .post(`/expenses/${uuid}`)
        .send(createExpenseDto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toEqual({
        message: 'Expense created successfully',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
        data: response.body.data,
        uuid,
        status: HttpStatus.CREATED,
      });

      expect(mockExpensesService.create).toHaveBeenCalledWith(
        uuid,
        createExpenseDto,
      );
    });

    it('should return UNAUTHORIZED if UUID is invalid', async () => {
      const uuid = 'invalid-uuid';
      const createExpenseDto = {
        amount: 100,
        description: 'Test',
        expenseType: 'FOOD',
      };
      const response = await request(app.getHttpServer())
        .post(`/expenses/${uuid}`)
        .send(createExpenseDto)
        .expect(HttpStatus.UNAUTHORIZED);

      expect(response.body.message).toContain('Validation failed');
    });

    it('should return 400 for invalid body', async () => {
      const uuid = 'bdf39d61-6e7b-4207-9094-d2ef6c37f6cb';
      const response = await request(app.getHttpServer())
        .post(`/expenses/${uuid}`)
        .send({})
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toContain('Validation failed');
    });

    it('should return UNAUTHORIZED for missing JWT', async () => {
      //TODO: Implement a test for missing JWT
    });
  });

  describe('findAll', () => {
    it('should return UNAUTHORIZED for invalid UUID', async () => {
      const uuid = 'invalid-uuid';
      const response = await request(app.getHttpServer())
        .get(`/expenses/${uuid}`)
        .expect(HttpStatus.UNAUTHORIZED);

      expect(response.body.message).toContain('Validation failed');
    });

    it('should return NOT_FOUND if user is not found', async () => {
      const uuid = 'bdf39d61-6e7b-4207-9094-d2ef6c37f6cb';
      mockExpensesService.findAll.mockRejectedValue(
        new NotFoundException('No User Found'),
      );

      const response = await request(app.getHttpServer())
        .get(`/expenses/${uuid}`)
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body.message).toBe('No User Found');
    });

    it('should return NOT_FOUND if user exist but has not expenses', async () => {
      const uuid = 'bdf39d61-6e7b-4207-9094-d2ef6c37f6cb';
      mockExpensesService.findAll.mockRejectedValue(
        new NotFoundException('No Expenses Found for User'),
      );

      const response = await request(app.getHttpServer())
        .get(`/expenses/${uuid}`)
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body.message).toBe('No Expenses Found for User');
    });

    it('should return FOUND and expenses of the user', async () => {
      const uuid = 'bdf39d61-6e7b-4207-9094-d2ef6c37f6cb';
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

      mockExpensesService.findAll.mockResolvedValue({
        message: 'Expenses for user found',
        data: mockExpenses,
        status: HttpStatus.FOUND,
      });

      const response = await request(app.getHttpServer())
        .get(`/expenses/${uuid}`)
        .expect(HttpStatus.FOUND);

      expect(response.body).toEqual({
        message: 'Expenses for user found',
        data: response.body.data,
        status: HttpStatus.FOUND,
      });
    });
  });

  describe('findOne', () => {
    it('should return NOT_FOUND if no expense was found', async () => {
      const uuid = 'bdf39d61-6e7b-4207-9094-d2ef6c37f6cb';
      mockExpensesService.findOne.mockRejectedValue(
        new NotFoundException('No Expense Found'),
      );
      const response = await request(app.getHttpServer())
        .get(`/expenses/single/${uuid}/`)
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body.message).toContain('No Expense Found');
    });

    it('should return expense and FOUND', async () => {
      const uuid = 'bdf39d61-6e7b-4207-9094-d2ef6c37f6cb';
      const mockExpenses = {
        id: '1',
        userId: uuid,
        amount: 100,
        description: 'Test Expense',
        expenseType: 'FOOD',
        date: new Date(),
        createdAt: new Date(),
      };
      mockExpensesService.findOne.mockResolvedValue({
        message: 'Expense found',
        data: mockExpenses,
        status: HttpStatus.FOUND,
      });

      const response = await request(app.getHttpServer())
        .get(`/expenses/single/${uuid}/`)
        .expect(HttpStatus.FOUND);
      expect(response.body.message).toContain('Expense found');
    });
  });

  describe('update', () => {
    it('should return', async () => {
      const uuid = 'bdf39d61-6e7b-4207-9094-d2ef6c37f6cb';
      const updateExpenseDto = {
        amount: 100,
        description: 'Test',
        expenseType: 'FOOD',
      };
      const mockExpense = {
        id: '1',
        userId: uuid,
        amount: updateExpenseDto.amount,
        description: updateExpenseDto.description,
        expenseType: updateExpenseDto.expenseType,
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockExpensesService.update.mockResolvedValue({
        message: 'Expense updated successfully',
        data: mockExpense,
        uuid: uuid,
        status: HttpStatus.ACCEPTED,
      });

      const response = await request(app.getHttpServer())
        .patch(`/expenses/${uuid}`)
        .send(updateExpenseDto)
        .expect(HttpStatus.ACCEPTED);

      expect(response.body.message).toContain('Expense updated successfully');
      expect(mockExpensesService.update).toBeCalledWith(uuid, updateExpenseDto);
    });
  });
});
