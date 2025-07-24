import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { UsersService } from '../users/users.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpenseTypeDto } from './dto/expense-type.dto';
import { RecurExpenseDto } from './dto/recu-expense.dto';
import { RecurringTransacService } from '../recurring-transac/recurring-transac.service';

@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly userService: UsersService,
    private readonly recurringTransacService: RecurringTransacService,
  ) {}
  async create(uuid: string, createExpenseDto: CreateExpenseDto) {
    return this.databaseService.$transaction(async (tx) => {
      // Check if user exists
      const user = await this.userService.findOne(uuid);
      if (!user) {
        throw new HttpException('No User Found', HttpStatus.NOT_FOUND);
      }

      // Create expense
      const expense = await tx.expenses.create({
        data: {
          ...createExpenseDto,
          userId: user.user.id,
        },
      });

      // Return success message with created expense
      return {
        message: 'Expense created successfully',
        data: expense,
        uuid: expense.userId,
        status: HttpStatus.CREATED,
      };
    });
  }

  async findAll(uuid: string) {
    try {
      // Check if user exists
      const userResponse = await this.userService.findOne(uuid);
      if (!userResponse || !userResponse.user) {
        throw new HttpException('No User Found', HttpStatus.NOT_FOUND);
      }

      const { user } = userResponse;

      // Check if user has expenses
      const expenses = await this.databaseService.expenses.findMany({
        where: { userId: user.id },
      });

      if (!expenses || expenses.length === 0) {
        throw new HttpException(
          'No Expenses Found for User',
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        message: 'Expenses for user found',
        expenses: expenses,
        status: HttpStatus.FOUND,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(error);
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async findOne(uuid: string) {
    try {
      // Check if expense exists
      const expense = await this.databaseService.expenses.findUnique({
        where: { id: uuid },
      });
      if (!expense) {
        throw new HttpException('No Expense Found', HttpStatus.NOT_FOUND);
      }

      return {
        message: 'Expense found',
        data: expense,
        status: HttpStatus.FOUND,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(error);
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async update(uuid: string, updateExpenseDto: UpdateExpenseDto) {
    return this.databaseService.$transaction(async (tx) => {
      // Check if expense exists
      const expense = await tx.expenses.findUnique({
        where: { id: uuid },
      });
      if (!expense) {
        throw new HttpException('No Expense Found', HttpStatus.NOT_FOUND);
      }

      // Update expense
      const updatedExpense = await tx.expenses.update({
        where: { id: uuid },
        data: {
          ...updateExpenseDto,
          userId: expense.userId,
        },
      });

      return {
        message: 'Expense updated successfully',
        data: updatedExpense,
        uuid: updatedExpense.userId,
        status: HttpStatus.ACCEPTED,
      };
    });
  }

  async getTotalExpenses(uuid: string) {
    try {
      // Check if user exists
      const userResponse = await this.userService.findOne(uuid);
      if (!userResponse || !userResponse.user) {
        throw new HttpException('No User Found', HttpStatus.NOT_FOUND);
      }

      const { user } = userResponse;

      //Get all expenses for the user
      const expensesResponse = await this.findAll(uuid);
      if (
        !expensesResponse ||
        !expensesResponse.expenses ||
        expensesResponse.expenses.length === 0
      ) {
        throw new HttpException(
          'No Expenses Found for User',
          HttpStatus.NOT_FOUND,
        );
      }

      const { expenses } = expensesResponse;

      // Extract total amount from expenses
      const totalAmount = expenses.reduce(
        (sum, expense) => sum + expense.amount,
        0,
      );

      return {
        uuid: user.id,
        totalAmount: totalAmount,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(error);
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async getTotalExpensesByType(uuid: string, expenseType: ExpenseTypeDto) {
    try {
      // Check if user exists
      const userResponse = await this.userService.findOne(uuid);
      if (!userResponse || !userResponse.user) {
        throw new HttpException('No User Found', HttpStatus.NOT_FOUND);
      }

      const { user } = userResponse;

      // Get all expenses with the specified type for the user
      const expenses = await this.databaseService.expenses.findMany({
        where: {
          userId: user.id,
          expenseType: expenseType.expenseType,
        },
        omit: {
          description: true,
          id: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
          date: true,
        },
      });

      // Check if expenses exist
      if (!expenses || expenses.length === 0) {
        throw new HttpException(
          'No Expenses Found for User with this type',
          HttpStatus.NOT_FOUND,
        );
      }

      // Calculate total amount for the specified expense type
      const totalAmount = expenses.reduce(
        (sum, expense) => sum + expense.amount,
        0,
      );

      return {
        uuid: user.id,
        expenseType: expenseType.expenseType,
        totalAmount: totalAmount,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(error);
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async createRecurringExpense(
    uuid: string,
    createRecurExpenseDto: RecurExpenseDto,
  ) {
    return this.databaseService.$transaction(async (tx) => {
      // Check if user exists
      const userResponse = await this.userService.findOne(uuid);
      if (!userResponse) {
        throw new NotFoundException('User not found.');
      }
      const { user } = userResponse;

      // Create recurring expense for user
      const recurExpense = await tx.recurringExpense.create({
        data: {
          ...createRecurExpenseDto,
          userId: user.id,
          isActive: true,
          nextExecutionDate: new Date(),
        },
      });

      return {
        message: 'Recurring expense details created successfully.',
        data: recurExpense,
        status: HttpStatus.CREATED,
      };
    });
  }
}
