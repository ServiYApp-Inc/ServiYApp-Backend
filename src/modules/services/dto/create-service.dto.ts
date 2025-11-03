import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsInt,
  Min,
} from 'class-validator';

// DTO para la creación de un nuevo servicio.
// Valida los campos obligatorios y opcionales antes de registrar el servicio.
export class CreateServiceDto {
  @IsString({ message: 'El nombre del servicio debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre del servicio es obligatorio' })
  name: string;

  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @IsOptional()
  description?: string;

  @IsString({ message: 'La URL de la foto debe ser una cadena de texto' })
  @IsOptional()
  photo?: string;

  @IsBoolean({ message: 'El estado debe ser un valor booleano (true o false)' })
  @IsOptional()
  status?: boolean;

  @IsInt({ message: 'La duración debe ser un número entero en minutos' })
  @IsOptional()
  @Min(1, { message: 'La duración mínima debe ser de 1 minuto' })
  duration?: number;

  @IsUUID('4', { message: 'El ID del proveedor debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El proveedor es obligatorio' })
  providerId: string;

  @IsUUID('4', { message: 'El ID de la categoría debe ser un UUID válido' })
  @IsOptional()
  categoryId?: string;
}
