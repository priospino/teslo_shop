import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from './products/products.module';
import { SeedModule } from './seed/seed.module';
import { FilesModule } from './files/files.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';


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
    
    ServeStaticModule.forRoot({
      rootPath: join(__dirname,'..','public'), 
    }),

    ProductsModule,
    SeedModule,
    FilesModule,
  ],
  
})
export class AppModule {}
