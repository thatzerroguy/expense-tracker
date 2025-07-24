import { forwardRef, Module } from '@nestjs/common';
import { IncomeService } from './income.service';
import { IncomeController } from './income.controller';
import { UsersModule } from '../users/users.module';
import { RecurringTransacModule } from '../recurring-transac/recurring-transac.module';

@Module({
  controllers: [IncomeController],
  providers: [IncomeService],
  imports: [UsersModule, forwardRef(() => RecurringTransacModule)],
  exports: [IncomeService],
})
export class IncomeModule {}
