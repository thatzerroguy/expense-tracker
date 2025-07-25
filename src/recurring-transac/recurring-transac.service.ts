import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { NextDateDto } from './dto/next-date.dto';
import { Cron } from '@nestjs/schedule';
import { IncomeService } from '../income/income.service';
import { ExpensesService } from '../expenses/expenses.service';

@Injectable()
export class RecurringTransacService {
  private readonly logger = new Logger(RecurringTransacService.name);
  constructor(
    @Inject(forwardRef(() => IncomeService))
    private readonly incomeService: IncomeService,
    @Inject(forwardRef(() => ExpensesService))
    private readonly expenseService: ExpensesService,
  ) {}

  public calculateNextExecutionDate(nextDateDto: NextDateDto) {
    const nextDate = new Date(nextDateDto.currentDate);

    switch (nextDateDto.frequency) {
      case 'DAILY':
        nextDate.setDate(nextDate.getDate() + nextDateDto.interval);
        break;
      case 'WEEKLY':
        nextDate.setDate(nextDate.getDate() - nextDateDto.interval * 7);
        break;
      case 'MONTHLY':
        nextDate.setDate(nextDate.getMonth() + nextDateDto.interval);
        break;
      case 'YEARLY':
        nextDate.setDate(nextDate.getFullYear() + nextDateDto.interval);
        break;
    }
    return nextDate;
  }

  @Cron('0 2 * * * *')
  async processRecurringTransactions() {
    try {
      this.logger.log('Starting to process recurring transactions');

      await this.incomeService.processRecurringIncome();
      await this.expenseService.processRecurringExpense();

      this.logger.log('Recurring transaction successful');
    } catch (error) {
      this.logger.error(error);
    }
  }
}
