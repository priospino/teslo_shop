import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from './products/products.module';
import { SeedModule } from './seed/seed.module';


@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres', // Define el tipo de base de datos; en este caso PostgreSQL.
      host: process.env.DB_HOST, 
      port: parseInt(process.env.DB_PORT || '5432', 10), // Puerto de conexión a la base de datos, convertido de string a número.
      database: process.env.DB_NAME,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      autoLoadEntities: true, // Carga automáticamente todas las entidades registradas en la aplicación
      synchronize: true, // Sincroniza automáticamente el esquema de la DB con las entidades (solo recomendable en desarrollo).
    }),
    ProductsModule,
    SeedModule,
  ],
  
})
export class AppModule {}
