import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { Repository, Like, ILike } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { Product } from './entities/product.entity';
import { PaginationResponse } from '../common/interfaces/pagination.interface';


@Injectable()
export class ProductsService {

  private readonly logger = new Logger(ProductsService.name);

  constructor(

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

  ) {}


  async create(createProductDto: CreateProductDto) {
    try {
      const product = this.productRepository.create(createProductDto);
      await this.productRepository.save( product );
      return product;
      
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }


  async findAll(queryDto: QueryProductDto): Promise<PaginationResponse<Product>> {
    const { limit = 10, offset = 0, search, gender, size } = queryDto;

    // 1. Crear query builder base
    const queryBuilder = this.productRepository.createQueryBuilder('product');

    // 2. Filtro por texto (título o descripción), con búsqueda insensible a mayúsculas
    if (search) {
      queryBuilder.where(
        '(LOWER(product.title) LIKE LOWER(:search) OR LOWER(product.description) LIKE LOWER(:search))',
        { search: `%${search}%` }
      );
    }

    // 3. Filtro por género (opcional)
    if (gender) {
      queryBuilder.andWhere('product.gender = :gender', { gender });
    }

    // 4. Filtro por talla (opcional), usando operador PostgreSQL `ANY`
    if (size) {
      queryBuilder.andWhere(':size = ANY(product.sizes)', { size });
    }

    // 5. Obtener el total de productos que cumplen los filtros (sin paginar aún)
    const total = await queryBuilder.getCount();

    // 6. Aplicar paginación y orden alfabético por título
    const products = await queryBuilder
      .skip(offset)   // desplazamiento de registros
      .take(limit)    // cantidad de registros por página
      .orderBy('product.title', 'ASC')
      .getMany();

    // 7. Cálculo de metadatos de paginación
    const totalPages = Math.ceil(total / limit);
    const currentPage = Math.floor(offset / limit) + 1;
    const hasNextPage = currentPage < totalPages;
    const hasPreviousPage = currentPage > 1;

    // 8. Devolver respuesta paginada con metadatos
    return {
      data: products,
      total,
      limit,
      offset,
      totalPages,
      currentPage,
      hasNextPage,
      hasPreviousPage,
    };
  }

  async remove(id: string) {
    const result = await this.productRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Product with id "${id}" not found`);
    }

    return { message: 'Product deleted successfully' };
  }

  
  async findOne(term: string) {
    let product: Product | null;

    // Verificar si el término es un UUID válido
    if (isUUID(term)) {
      // Buscar por ID
      product = await this.productRepository.findOneBy({ id: term });
    } else {
      const queryBuilder = this.productRepository.createQueryBuilder(); 
      product = await queryBuilder
        .where('UPPER(title) =:title or slug =:slug', {
          title: term.toUpperCase(),
          slug: term.toLowerCase(),
        }).getOne();
    }

    if (!product) {
      throw new NotFoundException(`Product with term "${term}" not found`);
    }

    return product;
  }




  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    // 0. Validar formato de UUID
    if (!isUUID(id)) {
      throw new BadRequestException(`Invalid UUID format for id: ${id}`);
    }

    // 1. Intentar precargar la entidad con el ID y los datos actualizados
    const product = await this.productRepository.preload({
      id,
      ...updateProductDto,
    });

    // 2. Si no se encuentra el producto, lanzar excepción 404
    if (!product) {
      throw new NotFoundException(`Product with id: ${id} not found`);
    }

    try {
      // 3. Guardar los cambios (preload + save = update)
      return await this.productRepository.save(product);
    } catch (error) {
      // 4. Manejo centralizado de errores de base de datos
      this.handleDBExceptions(error);
    }
  }

  

  private handleDBExceptions(error: any): never {
    this.logger.error(`[DB Error] ${error.code || 'UNKNOWN'}: ${error.detail || error.message}`);

    // Error por violación de restricción única (duplicado)
    if (error.code === '23505') {
      throw new BadRequestException(`Duplicate value: ${error.detail}`);
    }

    // Error no controlado
    throw new InternalServerErrorException('Unexpected database error, check server logs.');
  }


}
