import { IsOptional, IsString, IsIn, MaxLength } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryProductDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsIn(['men', 'women', 'kid', 'unisex'])
  gender?: string;

  @IsOptional()
  @IsString()
  size?: string;
} 