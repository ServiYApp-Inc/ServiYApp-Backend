import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

// DTO para crear una nueva categoría.
export class CreateCategoryDto {
  @IsString({ message: 'El nombre de la categoría debe ser un texto válido.' })
  @MinLength(3, { message: 'El nombre de la categoría debe tener al menos 3 caracteres.' })
  @MaxLength(50, { message: 'El nombre de la categoría no puede superar los 50 caracteres.' })
  name: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser un texto válido.' })
  @MaxLength(200, { message: 'La descripción no puede superar los 200 caracteres.' })
  description?: string;
}
