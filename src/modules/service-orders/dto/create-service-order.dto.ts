import { IsUUID, IsOptional, IsString } from 'class-validator';

export class CreateServiceOrderDto {
  @IsOptional()
  @IsString()
  status?: string; // opcional, por defecto será "pending"

  @IsString()
  @IsUUID()
  providerId: string;

  @IsUUID()
  userId: string;

  @IsUUID()
  serviceId: string;

  @IsUUID()
  addressId: string;
}
