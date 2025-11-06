import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
async uploadImage(
    file: Express.Multer.File,
    folder: string = 'serviyapp/profiles',
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      if (!file) {
        return reject(new BadRequestException('No se ha proporcionado ningún archivo'));
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        { folder },
        (error?: UploadApiErrorResponse, result?: UploadApiResponse) => {
          if (error) return reject(error);
          if (!result) return reject(new BadRequestException('Error al subir la imagen'));
          resolve(result);
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  /**
   * Sube una imagen a la carpeta correcta según tipo de entidad
   * @param file Archivo a subir
   * @param type Tipo de entidad ('user' | 'provider')
   */
  async uploadProfile(
    file: Express.Multer.File,
    type: 'user' | 'provider',
  ): Promise<UploadApiResponse> {
    const folder =
      type === 'provider' ? 'serviyapp/providers' : 'serviyapp/users';
    return this.uploadImage(file, folder);
  }
}
