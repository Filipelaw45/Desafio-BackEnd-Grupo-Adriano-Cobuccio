import { ApiProperty, OmitType } from '@nestjs/swagger';
import { UserDto } from './user.dto';

class UserListItemDto extends OmitType(UserDto, ['wallet'] as const) {}

export class UserResponseDto {
  @ApiProperty({ type: UserListItemDto, isArray: true })
  data: UserListItemDto[];

  @ApiProperty({ type: Number })
  total: number;

  @ApiProperty({ type: Number })
  page: number;

  @ApiProperty({ type: Number })
  limit: number;

  @ApiProperty({ type: Number })
  totalPages: number;
}
