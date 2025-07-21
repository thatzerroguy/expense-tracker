import { Test, TestingModule } from '@nestjs/testing';
import { IncomeController } from './income.controller';
import { IncomeService } from './income.service';
import { INestApplication } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { DatabaseService } from '../database/database.service';
import { JwtGuard } from '../guards/jwt.guard';

class MockJWTGuard {
  canActivate() {
    return true;
  }
}

describe('IncomeController', () => {
  let controller: IncomeController;
  let app: INestApplication;

  const mockIncomeService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };
  const mockUserService = {
    findOne: jest.fn(),
  };

  const mockDatabaseService = {
    income: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IncomeController],
      providers: [
        IncomeService,
        { provide: IncomeService, useValue: mockIncomeService },
        { provide: UsersService, useValue: mockUserService },
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    })
      .overrideGuard(JwtGuard)
      .useClass(MockJWTGuard)
      .compile();

    app = module.createNestApplication();
    await app.init();
    controller = module.get<IncomeController>(IncomeController);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
