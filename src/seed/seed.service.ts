import { Injectable } from '@nestjs/common';
import { ProductsService } from 'src/products/products.service';
import { initialData } from './data/seed-data';


@Injectable()
export class SeedService {

    constructor(
      private readonly productsService: ProductsService
    ) {}


  async runSeed() {

    await this.insertNewProducts();

    return 'SEED EXECUTED';
  }

  // Inserta nuevos productos en la base de datos a partir de los datos iniciales
  private async insertNewProducts() {
    // Elimina todos los productos existentes (y sus imágenes asociadas)
    await this.productsService.deleteAllProducts();

    // Obtiene el array de productos desde los datos iniciales
    const products = initialData.products;

    // Arreglo para almacenar las promesas de inserción
    const insertPromises: Promise<any>[] = [];

    // Por cada producto, crea la promesa de inserción y la agrega al arreglo
    products.forEach(product => {
      insertPromises.push(this.productsService.create(product));
    });

    // Espera a que todas las inserciones se completen en paralelo
    await Promise.all(insertPromises);

    return true;
  }
 
}
