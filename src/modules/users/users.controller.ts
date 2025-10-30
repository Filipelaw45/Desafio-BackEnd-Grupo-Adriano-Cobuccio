import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiBody,
} from '@nestjs/swagger';
import { UserResponseDto } from './dto/user-response.dto';

@ApiTags('users')
@Controller('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar usuários' })
  @ApiQuery({ name: 'name', required: false, description: 'Filtro por nome', type: String })
  @ApiQuery({ name: 'email', required: false, description: 'Filtro por email', type: String })
  @ApiQuery({ name: 'page', required: false, description: 'Página (padrão: 1)', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite por página (padrão: 100)', type: Number })
  @ApiOkResponse({ description: 'Lista paginada de usuários', type: UserResponseDto })
  @HttpCode(HttpStatus.OK)
  async getUsers(@Query() query: QueryUserDto): Promise<UserResponseDto> {
    const users = await this.usersService.findAll(query);
    return users;
  }

  @Get('/me')
  @ApiOperation({ summary: 'Obter detalhes do usuário logado' })
  @ApiOkResponse({ description: 'Usuário encontrado', type: UserDto })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado' })
  @HttpCode(HttpStatus.OK)
  async getUserById(@CurrentUser() userId: string): Promise<UserDto> {
    const user = await this.usersService.findById(userId);
    return user;
  }

  @Patch()
  @ApiOperation({ summary: 'Atualizar dados do usuário' })
  @ApiBody({ type: UpdateUserDto })
  @ApiOkResponse({ description: 'Usuário atualizado', type: UserDto })
  @ApiBadRequestResponse({ description: 'Dados inválidos' })
  @ApiUnauthorizedResponse({ description: 'Não autorizado' })
  @HttpCode(HttpStatus.OK)
  async updateUser(@Body() updateUserDto: UpdateUserDto, @CurrentUser() userId: string): Promise<UserDto> {
    const user = await this.usersService.update(userId, updateUserDto);
    return user;
  }

  @Delete()
  @ApiOperation({ summary: 'Deletar usuário logado' })
  @ApiNoContentResponse({ description: 'Usuário deletado com sucesso' })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado' })
  @ApiUnauthorizedResponse({ description: 'Não autorizado' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@CurrentUser() userId: string): Promise<void> {
    await this.usersService.delete(userId);
  }
}
