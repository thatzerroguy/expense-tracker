import { forwardRef, Module } from '@nestjs/common';
import { RecurringTransacService } from './recurring-transac.service';
import { RecurringTransacController } from './recurring-transac.controller';
import { IncomeModule } from '../income/income.module';
import { ExpensesModule } from '../expenses/expenses.module';

@Module({
  controllers: [RecurringTransacController],
  providers: [RecurringTransacService],
  imports: [forwardRef(() => IncomeModule), forwardRef(() => ExpensesModule)],
  exports: [RecurringTransacService],
})
export class RecurringTransacModule {}
