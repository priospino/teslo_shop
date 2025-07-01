import { IsOptional, IsString, IsIn } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryProductDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['men', 'women', 'kid', 'unisex'])
  gender?: string;

  @IsOptional()
  @IsString()
  size?: string;
} 