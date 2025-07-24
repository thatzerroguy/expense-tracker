import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { DatabaseService } from '../database/database.service';
import { UsersService } from '../users/users.service';
import { RecurIncomeDto } from './dto/recur-income.dto';

@Injectable()
export class IncomeService {
  private readonly logger = new Logger(IncomeService.name);
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly userService: UsersService,
  ) {}
  async create(uuid: string, createIncomeDto: CreateIncomeDto) {
    return this.databaseService.$transaction(async (tx) => {
      // Check if user exist
      const userResponse = await this.userService.findOne(uuid);
      if (!userResponse) {
        throw new HttpException(
          `User with id ${uuid} not found`,
          HttpStatus.NOT_FOUND,
        );
      }
      const { user } = userResponse;

      // Create income for user
      const income = await tx.income.create({
        data: { ...createIncomeDto, userId: user.id },
      });

      return {
        message: 'Income logged successfully.',
        data: income,
        status: HttpStatus.CREATED,
      };
    });
  }

  async findAll(uuid: string) {
    try {
      // Check if user exist
      const userResponse = await this.userService.findOne(uuid);
      if (!userResponse) {
        throw new NotFoundException('User not found');
      }
      const { user } = userResponse;

      // Find all income related to user
      const income = await this.databaseService.income.findMany({
        where: { userId: uuid },
        omit: { updatedAt: true },
      });

      if (!income || income.length === 0) {
        throw new NotFoundException(
          `No income logs found for user with id ${uuid}.`,
        );
      }

      return {
        message: 'Income logs found successfully',
        data: income,
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
      // Find income log with id
      const income = await this.databaseService.income.findUnique({
        where: { id: uuid },
      });
      if (!income) {
        throw new NotFoundException('No income with id found.');
      }
      return {
        message: 'Income details found successfully.',
        data: income,
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

  async update(uuid: string, updateIncomeDto: UpdateIncomeDto) {
    return this.databaseService.$transaction(async (tx) => {
      // Check if income logs exists
      const income = await tx.income.findUnique({ where: { id: uuid } });
      if (!income) {
        throw new NotFoundException('No Income Found');
      }

      // update income log
      const updateIncome = await tx.income.update({
        where: { id: uuid },
        data: {
          ...updateIncomeDto,
          userId: uuid,
        },
      });

      return {
        message: 'Income log updated successfully.',
        data: updateIncome,
        uuid: uuid,
        status: HttpStatus.ACCEPTED,
      };
    });
  }

  // Recurring income logging for user
  async createRecurringIncome(uuid: string, recurIncomeDto: RecurIncomeDto) {
    return this.databaseService.$transaction(async (tx) => {
      // Check if user exists
      const userResponse = await this.userService.findOne(uuid);
      if (!userResponse) {
        throw new NotFoundException('No user with id found.');
      }

      const { user } = userResponse;

      // Create recurring income details
      const recurIncome = await tx.recurringIncome.create({
        data: {
          ...recurIncomeDto,
          userId: user.id,
          isActive: true,
          nextExecutionDate: new Date().toISOString(),
        },
      });

      return {
        message: 'Recurring Income details created successfully.',
        data: recurIncome,
        status: HttpStatus.CREATED,
      };
    });
  }
}
