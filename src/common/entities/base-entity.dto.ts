import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@Exclude()
export class BaseEntityDto {
  @ApiProperty({ type: String, required: false })
  @Expose()
  id: string;

  @ApiProperty({ type: String, format: 'date-time', required: false })
  @Expose()
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time', required: false })
  @Expose()
  updatedAt: Date;
}
