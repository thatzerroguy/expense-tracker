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
import { IncomeService } from './income.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { JwtGuard } from '../guards/jwt.guard';
import { ZodValidationPipe } from '../pipes/validation.pipe';
import { RecurIncomeDto, RecurIncomeSchema } from './dto/recur-income.dto';

@Controller('income')
export class IncomeController {
  constructor(private readonly incomeService: IncomeService) {}

  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.CREATED)
  @Post(':uuid')
  create(
    @Param(
      'uuid',
      new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.UNAUTHORIZED }),
    )
    uuid: string,
    @Body()
    createIncomeDto: CreateIncomeDto,
  ) {
    return this.incomeService.create(uuid, createIncomeDto);
  }

  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.FOUND)
  @Get(':uuid')
  findAll(
    @Param(
      'uuid',
      new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.UNAUTHORIZED }),
    )
    uuid: string,
  ) {
    return this.incomeService.findAll(uuid);
  }

  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.FOUND)
  @Get('/single/:uuid')
  findOne(
    @Param(
      'uuid',
      new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.UNAUTHORIZED }),
    )
    uuid: string,
  ) {
    return this.incomeService.findOne(uuid);
  }

  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  @Patch(':uuid')
  update(
    @Param(
      'uuid',
      new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.UNAUTHORIZED }),
    )
    uuid: string,
    @Body() updateIncomeDto: UpdateIncomeDto,
  ) {
    return this.incomeService.update(uuid, updateIncomeDto);
  }

  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.CREATED)
  @Post('/recur/:uuid')
  createRecurIncome(
    @Param(
      'uuid',
      new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.UNAUTHORIZED }),
    )
    uuid: string,
    @Body(new ZodValidationPipe(RecurIncomeSchema))
    createRecurIncome: RecurIncomeDto,
  ) {
    return this.incomeService.createRecurringIncome(uuid, createRecurIncome);
  }
}
