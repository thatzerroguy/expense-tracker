import { Test, TestingModule } from '@nestjs/testing';
import { RecurringTransacController } from './recurring-transac.controller';
import { RecurringTransacService } from './recurring-transac.service';

describe('RecurringTransacController', () => {
  let controller: RecurringTransacController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecurringTransacController],
      providers: [RecurringTransacService],
    }).compile();

    controller = module.get<RecurringTransacController>(RecurringTransacController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
