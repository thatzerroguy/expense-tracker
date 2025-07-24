import { Module } from '@nestjs/common';
import { IncomeService } from './income.service';
import { IncomeController } from './income.controller';
import { UsersModule } from '../users/users.module';

@Module({
  controllers: [IncomeController],
  providers: [IncomeService],
  imports: [UsersModule],
})
export class IncomeModule {}
