import { Module } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';
import { UsersModule } from '../users/users.module';

@Module({
  controllers: [ExpensesController],
  providers: [ExpensesService],
  imports: [UsersModule],
})
export class ExpensesModule {}
