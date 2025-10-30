import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { LoginDto } from './dto/login-dto';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';
import { LoginResponseDto } from './dto/login-response.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Autenticar usuário (login)' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ description: 'Token de acesso gerado', type: LoginResponseDto })
  @ApiUnauthorizedResponse({ description: 'Credenciais inválidas' })
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    const token = await this.authService.signIn(loginDto.email, loginDto.password);
    return token;
  }

  @Post('register')
  @ApiOperation({ summary: 'Registrar novo usuário' })
  @ApiBody({ type: CreateUserDto })
  @ApiCreatedResponse({ description: 'Usuário registrado com sucesso', type: RegisterResponseDto })
  @ApiBadRequestResponse({ description: 'Dados inválidos ou email já cadastrado' })
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() createUserDto: CreateUserDto): Promise<RegisterResponseDto> {
    await this.usersService.create(createUserDto);
    return { message: 'Usuário registrado com sucesso' };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Atualizar token via refresh token' })
  @ApiBody({ schema: { type: 'object', properties: { refreshToken: { type: 'string' } }, required: ['refreshToken'] } })
  @ApiOkResponse({ description: 'Novo token de acesso', type: LoginResponseDto })
  @ApiUnauthorizedResponse({ description: 'Refresh token inválido ou expirado' })
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: { refreshToken: string }): Promise<LoginResponseDto> {
    const { refreshToken } = body;
    return this.authService.refresh(refreshToken);
  }
}
