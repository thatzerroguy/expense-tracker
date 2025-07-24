import { Controller } from '@nestjs/common';
import { RecurringTransacService } from './recurring-transac.service';

@Controller('recurring-transac')
export class RecurringTransacController {
  constructor(private readonly recurringTransacService: RecurringTransacService) {}
}
