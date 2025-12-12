import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, IsIn, ArrayMinSize } from 'class-validator';

export class CreateChatDto {
  @ApiProperty({ enum: ['direct', 'group', 'channel'] })
  @IsString()
  @IsIn(['direct', 'group', 'channel'])
  type: 'direct' | 'group' | 'channel';

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  memberIds: string[];
}
