import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import {
  CreateExpenseDto,
  createExpenseSchema,
} from './dto/create-expense.dto';
import {
  UpdateExpenseDto,
  updateExpenseSchema,
} from './dto/update-expense.dto';
import { ZodValidationPipe } from '../pipes/validation.pipe';
import { JwtGuard } from '../guards/jwt.guard';
import { RecurExpenseDto, RecurExpenseSchema } from './dto/recu-expense.dto';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.CREATED)
  @Post(':uuid')
  async create(
    @Param(
      'uuid',
      new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.UNAUTHORIZED }),
    )
    uuid: string,
    @Body(new ZodValidationPipe(createExpenseSchema))
    createExpenseDto: CreateExpenseDto,
  ) {
    return await this.expensesService.create(uuid, createExpenseDto);
  }

  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.FOUND)
  @Get(':uuid')
  async findAll(
    @Param(
      'uuid',
      new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.UNAUTHORIZED }),
    )
    uuid: string,
  ) {
    return await this.expensesService.findAll(uuid);
  }

  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.FOUND)
  @Get('/single/:uuid')
  async findOne(
    @Param(
      'uuid',
      new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.UNAUTHORIZED }),
    )
    uuid: string,
  ) {
    return await this.expensesService.findOne(uuid);
  }

  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  @Patch(':uuid')
  async update(
    @Param(
      'uuid',
      new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.UNAUTHORIZED }),
    )
    uuid: string,
    @Body(new ZodValidationPipe(updateExpenseSchema))
    updateExpenseDto: UpdateExpenseDto,
  ) {
    return await this.expensesService.update(uuid, updateExpenseDto);
  }

  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.CREATED)
  @Post('/recur/:uuid')
  createRecurExpense(
    @Param(
      'uuid',
      new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.UNAUTHORIZED }),
    )
    uuid: string,
    @Body(new ZodValidationPipe(RecurExpenseSchema))
    createRecurIncome: RecurExpenseDto,
  ) {
    return this.expensesService.createRecurringExpense(uuid, createRecurIncome);
  }
}
