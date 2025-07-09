import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { Repository, Like, ILike } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { Product } from './entities/product.entity';
import { PaginationResponse } from '../common/interfaces/pagination.interface';
import { ProductImage } from './entities/product-image.entity';


@Injectable()
export class ProductsService {

  private readonly logger = new Logger(ProductsService.name);

  constructor(

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

  ) {}


 // Método asíncrono para crear un nuevo producto en la base de datos
// Método asíncrono para crear un nuevo producto en la base de datos
async create(createProductDto: CreateProductDto) {
  try {
    // Se extraen las imágenes del DTO (por defecto es un array vacío si no vienen)
    // y se separan del resto de propiedades del producto
    const { images = [], ...productDetails } = createProductDto;

    // Se crea una instancia del producto con las propiedades del DTO, excluyendo las imágenes
    // Las imágenes se transforman a entidades utilizando el repositorio de imágenes (asumiendo relación @OneToMany)
    const product = this.productRepository.create({
      ...productDetails,
      images: images.map(image => this.productImageRepository.create({ url: image }))
    });

    // Se guarda el producto (junto con las imágenes relacionadas) en la base de datos
    await this.productRepository.save(product);

    // Se retorna el producto guardado, que incluye las relaciones cargadas
    return product;

  } catch (error) {
    // En caso de error en base de datos, se maneja mediante un método centralizado
    this.handleDBExceptions(error);
  }
}


  async findAll(queryDto: QueryProductDto): Promise<PaginationResponse<any>> {
    const { limit = 10, offset = 0, search, gender, size } = queryDto;

    // 1. Crear query builder base con relaciones
    const queryBuilder = this.productRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.images', 'images');

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
      data: products.map(product => ({
        ...product,
        images: product.images?.map(img => img.url) || []
      })),
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
      // Buscar por ID con relaciones
      product = await this.productRepository.findOne({
        where: { id: term },
        relations: ['images']
      });
    } else {
      // Buscar por slug con relaciones
      product = await this.productRepository.findOne({
        where: { slug: term },
        relations: ['images']
      });
    }

    if (!product) {
      throw new NotFoundException(`Product with term "${term}" not found`);
    }

    return product;
  }




  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    if (!isUUID(id)) {
      throw new BadRequestException(`Invalid UUID format for id: ${id}`);
    }

    // Iniciar QueryRunner para transacción
    const queryRunner = this.productRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Buscar producto existente con imágenes
      const existingProduct = await queryRunner.manager.findOne(Product, { where: { id }, relations: ['images'] });
      if (!existingProduct) {
        throw new NotFoundException(`Product with id: ${id} not found`);
      }

      let images = existingProduct.images;
      if (updateProductDto.images) {
        // Eliminar imágenes antiguas
        await queryRunner.manager.delete(ProductImage, { product: { id } });
        // Asignar nuevas imágenes
        images = updateProductDto.images.map(url => queryRunner.manager.create(ProductImage, { url }));
      }

      // Preload con datos actualizados
      const product = await queryRunner.manager.preload(Product, {
        id,
        ...updateProductDto,
        images
      });
      if (!product) {
        throw new NotFoundException(`Product with id: ${id} not found`);
      }

      const savedProduct = await queryRunner.manager.save(product);
      await queryRunner.commitTransaction();
      return savedProduct;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.handleDBExceptions(error);
    } finally {
      await queryRunner.release();
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
  

  async deleteAllProducts() {
    const query = this.productRepository.createQueryBuilder('product');

    try {
      return await query
        .delete()
        .where({})
        .execute();

    } catch (error) {
      this.handleDBExceptions(error);
    }

  }


}
