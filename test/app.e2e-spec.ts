import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { DatabaseModule } from '../src/database/database.module';
import { AuthModule } from '../src/auth/auth.module';
import { UsersModule } from '../src/users/users.module';
import { GoogleGuard } from '../src/guards/google.guard';
import { MockGoogleGuard } from '../src/auth/auth.controller.spec';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule, AuthModule, UsersModule],
    })
      .overrideProvider(GoogleGuard)
      .useClass(MockGoogleGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });
});
