import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProviderDocument } from './entities/provider-document.entity';
import { Provider } from './entities/provider.entity';
import { v2 as cloudinary } from 'cloudinary';
import { DocumentStatus } from './enums/document-status.enum';

@Injectable()
export class ProviderDocumentsService {
  constructor(
    @InjectRepository(ProviderDocument)
    private readonly providerDocumentRepo: Repository<ProviderDocument>,

    @InjectRepository(Provider)
    private readonly providerRepo: Repository<Provider>,
  ) {}

  async uploadToCloudinary(file: Express.Multer.File, folder: string) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder,
        resource_type: 'auto', // detecta pdf, img, etc.
      });
      return result.secure_url;
    } catch (err) {
      throw new BadRequestException('Error al subir el archivo a Cloudinary');
    }
  }

  async create(
    providerId: string,
    files: { file?: Express.Multer.File[]; photoVerification?: Express.Multer.File[]; accountFile?: Express.Multer.File[] },
    dto: any,
  ) {
    const provider = await this.providerRepo.findOne({ where: { id: providerId } });
    if (!provider) throw new NotFoundException('Proveedor no encontrado');

    const document = new ProviderDocument();
    document.provider = provider;
    document.documentType = dto.documentType;
    document.documentNumber = dto.documentNumber;
    document.description = dto.description || null;
    document.accountType = dto.accountType || null;
    document.accountNumber = dto.accountNumber || null;
    document.bank = dto.bank || null;
    document.status = DocumentStatus.PENDING;

    // Subida de archivos (si los hay)
    if (files.file?.[0]) {
      const pdf = files.file[0];
      if (!pdf.mimetype.includes('pdf')) throw new BadRequestException('El archivo principal debe ser un PDF');
      document.file = await this.uploadToCloudinary(pdf, 'providers/documents');
    }

    if (files.photoVerification?.[0]) {
      const photo = files.photoVerification[0];
      if (!photo.mimetype.startsWith('image/')) throw new BadRequestException('La foto de verificación debe ser una imagen');
      document.photoVerification = await this.uploadToCloudinary(photo, 'providers/verifications');
    }

    if (files.accountFile?.[0]) {
      const acc = files.accountFile[0];
      if (!acc.mimetype.includes('pdf')) throw new BadRequestException('El soporte bancario debe ser un PDF');
      document.accountFile = await this.uploadToCloudinary(acc, 'providers/accounts');
    }

    return await this.providerDocumentRepo.save(document);
  }

  async findAll(providerId: string) {
    return this.providerDocumentRepo.find({
      where: { provider: { id: providerId } },
      order: { date: 'DESC' },
    });
  }

  async updateStatus(id: string, status: DocumentStatus) {
    const doc = await this.providerDocumentRepo.findOne({ where: { id } });
    if (!doc) throw new NotFoundException('Documento no encontrado');
    doc.status = status;
    return this.providerDocumentRepo.save(doc);
  }
}
