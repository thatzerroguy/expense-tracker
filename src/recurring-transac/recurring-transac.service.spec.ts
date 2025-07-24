import { Test, TestingModule } from '@nestjs/testing';
import { RecurringTransacService } from './recurring-transac.service';

describe('RecurringTransacService', () => {
  let service: RecurringTransacService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecurringTransacService],
    }).compile();

    service = module.get<RecurringTransacService>(RecurringTransacService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
