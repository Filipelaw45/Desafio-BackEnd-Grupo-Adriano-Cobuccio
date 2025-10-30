import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponseDto {
  @ApiProperty({
    description: 'Mensagem de sucesso',
    example: 'Usuário registrado com sucesso',
  })
  message: string;
}
