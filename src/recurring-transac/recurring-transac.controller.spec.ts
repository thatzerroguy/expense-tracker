import { Test, TestingModule } from '@nestjs/testing';
import { RecurringTransacController } from './recurring-transac.controller';
import { RecurringTransacService } from './recurring-transac.service';
import { INestApplication } from '@nestjs/common';

describe('RecurringTransacController', () => {
  let controller: RecurringTransacController;
  let app: INestApplication;
  const mockRecurringTransacService = {
    processRecurringTransactions: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecurringTransacController],
      providers: [
        RecurringTransacService,
        {
          provide: RecurringTransacService,
          useValue: mockRecurringTransacService,
        },
      ],
    }).compile();

    controller = module.get<RecurringTransacController>(
      RecurringTransacController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
