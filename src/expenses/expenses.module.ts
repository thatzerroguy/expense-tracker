import { Module } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';
import { UsersModule } from '../users/users.module';
import { RecurringTransacModule } from '../recurring-transac/recurring-transac.module';

@Module({
  controllers: [ExpensesController],
  providers: [ExpensesService],
  imports: [UsersModule, RecurringTransacModule],
})
export class ExpensesModule {}
