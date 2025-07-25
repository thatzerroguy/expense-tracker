import { Test, TestingModule } from '@nestjs/testing';
import { RecurringTransacService } from './recurring-transac.service';
import { IncomeService } from '../income/income.service';
import { ExpensesService } from '../expenses/expenses.service';

describe('RecurringTransacService', () => {
  let service: RecurringTransacService;

  const mockIncomeService = {
    processRecurringIncome: jest.fn(),
  };
  const mockExpenseService = {
    processRecurringExpense: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecurringTransacService,
        { provide: IncomeService, useValue: mockIncomeService },
        { provide: ExpensesService, useValue: mockExpenseService },
      ],
    }).compile();

    service = module.get<RecurringTransacService>(RecurringTransacService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
