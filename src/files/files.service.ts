import { BadRequestException, Injectable } from '@nestjs/common';
import { existsSync } from 'fs';
import { join } from 'path';


@Injectable()
export class FilesService {

    /**
     * Devuelve la ruta absoluta de una imagen de producto estática,
     * validando primero que el archivo exista físicamente.
     * 
     * @param imageName Nombre del archivo de imagen a buscar
     * @throws BadRequestException Si la imagen no existe en el sistema de archivos
     * @returns string Ruta absoluta al archivo de imagen
     */
    getStaticProductImage(imageName: string) {
        // Construye la ruta absoluta hacia la imagen
        const path = join(__dirname, '../../static/products', imageName);

        // Verifica si el archivo existe en el sistema de archivos
        if (!existsSync(path)) 
            // Si no existe, arroja una excepción HTTP 400 con mensaje detallado
            throw new BadRequestException(`No product found with image ${imageName}`);

        // Si el archivo existe, retorna la ruta absoluta
        return path;
    }
}
