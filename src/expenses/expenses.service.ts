import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { UsersService } from '../users/users.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly userService: UsersService,
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
      const user = await this.userService.findOne(uuid);
      if (!user) {
        throw new HttpException('No User Found', HttpStatus.NOT_FOUND);
      }

      // Check if user has expenses
      const expenses = await this.databaseService.expenses.findMany({
        where: { userId: uuid },
      });

      if (!expenses || expenses.length === 0) {
        throw new HttpException(
          'No Expenses Found for User',
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        message: 'Expenses for user found',
        data: expenses,
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

  update(id: number, updateExpenseDto: UpdateExpenseDto) {
    return `This action updates a #${id} expense`;
  }

  remove(id: number) {
    return `This action removes a #${id} expense`;
  }
}
