import { Controller, Post, Get, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ReverseTransactionDto } from './dto/reverse-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { TransactionDto } from './dto/transaction.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UuidParam } from '../../common/decorators/uuid-param.decorator';

@ApiTags('transactions')
@ApiBearerAuth()
@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('transfer')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Transferir fundos entre carteiras' })
  @ApiCreatedResponse({ description: 'Transferência criada com sucesso', type: TransactionDto })
  @ApiBadRequestResponse({ description: 'Dados da transferência inválidos' })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou ausente' })
  async transfer(@CurrentUser() userId: string, @Body() createTransactionDto: CreateTransactionDto): Promise<TransactionDto> {
    return this.transactionsService.transfer(userId, createTransactionDto);
  }

  @Post(':id/reverse')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Estornar (reversão) de uma transação' })
  @ApiParam({ name: 'id', description: 'UUID da transação a ser revertida' })
  @ApiOkResponse({ description: 'Transação revertida com sucesso', type: TransactionDto })
  @ApiBadRequestResponse({ description: 'Dados inválidos para reversão' })
  @ApiNotFoundResponse({ description: 'Transação não encontrada' })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou ausente' })
  async reverse(
    @UuidParam('id') id: string,
    @CurrentUser() userId: string,
    @Body() reverseDto: ReverseTransactionDto,
  ): Promise<TransactionDto> {
    return this.transactionsService.reverse(id, userId, reverseDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar transações do usuário' })
  @ApiOkResponse({ description: 'Lista de transações do usuário', type:  TransactionDto , isArray: true })
  @ApiBadRequestResponse({ description: 'Parâmetros de consulta inválidos' })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou ausente' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página (opcional)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Quantidade por página (opcional)' })
  async findUserTransactions(@CurrentUser() userId: string, @Query() queryDto: QueryTransactionDto) {
    return this.transactionsService.findUserTransactions(userId, queryDto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obter detalhes de uma transação por id' })
  @ApiParam({ name: 'id', description: 'UUID da transação' })
  @ApiOkResponse({ description: 'Detalhes da transação', type: TransactionDto })
  @ApiNotFoundResponse({ description: 'Transação não encontrada' })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou ausente' })
  async findOne(@UuidParam('id') id: string, @CurrentUser() userId: string): Promise<TransactionDto> {
    return this.transactionsService.findOne(id, userId);
  }
}
