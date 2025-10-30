import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ type: String, required: true })
  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  name: string;

  @ApiProperty({ type: String, required: true })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(250)
  email: string;

  @ApiProperty({ type: String, required: true })
  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  @Matches(
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=])[0-9a-zA-Z!@#$%^&*()_+\-=]{8,}$/,
    {
      message:
        'A senha deve ter no mínimo 8 caracteres, pelo menos 1 letra minúscula, 1 letra maiúscula, 1 número e 1 caractere especial',
    },
  )
  password: string;
}
