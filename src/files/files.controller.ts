import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFile, UseInterceptors, BadRequestException, Res, StreamableFile } from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { fileNamer } from './helpers/fileNamer.helper';
import { Response } from 'express';
import { fileFilter } from './helpers/fileFilter.helper';
import { FilesService } from './files.service';
import { ConfigService } from '@nestjs/config';

@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly configService: ConfigService
  ) {}

  @Get('product/:imageName')
  findProductImage(
    @Res() res: Response,
    @Param('imageName') imageName: string
  ) {

    const path = this.filesService.getStaticProductImage( imageName );

    res.sendFile( path );
  }

  /*@Get('product/:imageName')
  findProductImage(
    @Param('imageName') imageName: string,
  ): StreamableFile {
    const path = this.filesService.getStaticProductImage(imageName);
    const fileStream = createReadStream(path); // Crea stream del archivo
    return new StreamableFile(fileStream);     // Devuelve archivo como stream
  }*/

  
  @Post('product')
  @UseInterceptors( FileInterceptor('file', 
    {
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 2 }, // 2 MB
    storage: diskStorage({
        destination: './static/products',
        filename: fileNamer
      })
    }
  ) )
  uploadProductImage( 
    @UploadedFile() file: Express.Multer.File) {

    if ( !file ) {
      throw new BadRequestException('Make sure that the file is an image');
    }
    console.log(file);
    //return file.originalname;
    const secureUrl = `${ this.configService.get('HOST_API') }/files/product/${ file.filename }`;

    return { secureUrl };
  }


}
