import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit {
  private readonly logger: Logger;

  constructor() {
    super();
    this.logger = new Logger(DatabaseService.name);
  }
  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connection established successfully');
    } catch (error) {
      this.logger.error('Database connection failed', error);
      throw error;
    }
  }
}
