import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsString } from 'class-validator';

// DTO para la actualización de usuarios.
// Extiende de CreateUserDto, haciendo que todos los campos sean opcionales.
export class UpdateUserDto extends PartialType(CreateUserDto) {}
