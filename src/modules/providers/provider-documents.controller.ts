import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  Body,
  Param,
  Get,
  Patch,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ProviderDocumentsService } from './provider-documents.service';
import { DocumentStatus } from './enums/document-status.enum';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';

@ApiTags('provider-documents')
@Controller('provider-documents')
export class ProviderDocumentsController {
  constructor(private readonly providerDocumentsService: ProviderDocumentsService) {}

  @Post(':providerId')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'file', maxCount: 1 },
      { name: 'photoVerification', maxCount: 1 },
      { name: 'accountFile', maxCount: 1 },
    ]),
  )
  async uploadDocuments(
    @Param('providerId') providerId: string,
    @UploadedFiles()
    files: {
      file?: Express.Multer.File[];
      photoVerification?: Express.Multer.File[];
      accountFile?: Express.Multer.File[];
    },
    @Body() dto: any,
  ) {
    return this.providerDocumentsService.create(providerId, files, dto);
  }

  @Get(':providerId')
  async findAll(@Param('providerId') providerId: string) {
    return this.providerDocumentsService.findAll(providerId);
  }

  @Patch('status/:id')
  async updateStatus(@Param('id') id: string, @Body('status') status: DocumentStatus) {
    return this.providerDocumentsService.updateStatus(id, status);
  }
}
