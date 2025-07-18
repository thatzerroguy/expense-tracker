import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UsersService {
  private readonly logger: Logger;
  constructor(private readonly databaseService: DatabaseService) {
    this.logger = new Logger(UsersService.name);
  }
  async findAll() {
    try {
      const users = await this.databaseService.user.findMany();
      if (!users || users.length === 0) {
        throw new HttpException('No User Found', HttpStatus.NOT_FOUND);
      }

      return {
        message: 'Users found',
        data: users,
        status: HttpStatus.FOUND,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('FindAll failed', error);
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async findOne(uuid: string) {
    try {
      const user = await this.databaseService.user.findUnique({
        where: { id: uuid },
        omit: { password: true },
      });
      if (!user) {
        throw new HttpException('No User Found', HttpStatus.NOT_FOUND);
      }

      return {
        message: 'User found',
        user: user,
        status: HttpStatus.FOUND,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('FindOne failed', error);
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  async getByEmail(email: string) {
    try {
      return await this.databaseService.user.findUnique({ where: { email } });
    } catch (error) {
      this.logger.error('FindByEmail failed', error);
      throw new InternalServerErrorException({
        error: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }
}
