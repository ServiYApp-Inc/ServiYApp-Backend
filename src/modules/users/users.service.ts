import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { UserStatus } from './enums/user-status.enum';
import { In } from 'typeorm'; 

// Servicio encargado de la lógica de negocio de los usuarios.
// Gestiona operaciones CRUD y consultas específicas.
@Injectable()
export class UsersService {
  validatePassword(password: string, password1: string) {
    throw new Error('Method not implemented.');
  }
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Buscar usuario por correo electrónico.
  async findByEmail(email: string): Promise<User | null> {
    if (!email) return null;
    return this.userRepository.findOne({
      where: { email: email.trim().toLowerCase() },
    });
  }

  // Crear un nuevo usuario (utilizado por AuthService).
  async create(data: Partial<User>): Promise<User> {
    try {
      const newUser = this.userRepository.create(data);

      // Hashear contraseña solo si se proporciona
      if (data.password) {
        const saltRounds = 10;
        newUser.password = await bcrypt.hash(data.password, saltRounds);
      }

      return await this.userRepository.save(newUser);
    } catch (error) {
      throw new BadRequestException('Error al crear el usuario');
    }
  }


  // Obtener todos los usuarios registrados con posibilidad de filtro.
  async findAll(status?: UserStatus): Promise<User[]> {
    const where = status ? { status } : {};
    return this.userRepository.find({
      where,
      order: { registrationDate: 'DESC' },
    });
  }

  // Obtener un usuario por su ID.
  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    return user;
  }

  // Actualizar la información de un usuario.
  // Permite modificar campos internos como isCompleted.
  async update(id: string, data: Partial<User>): Promise<User> {
    try {
      const user = await this.findOne(id);
      if (!user) throw new BadRequestException('Usuario no encontrado');

      // Si el usuario desea cambiar su contraseña, la hasheamos
      if (data.password) {
        const saltRounds = 10;
        data.password = await bcrypt.hash(data.password, saltRounds);
      }

      Object.assign(user, data);
      return await this.userRepository.save(user);
    } catch (error) {
      throw new BadRequestException('Error al actualizar el usuario');
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    const user = await this.findOne(id);
    if (!user) throw new BadRequestException('Usuario no encontrado');

    user.status = UserStatus.DELETED;
    await this.userRepository.save(user);

    return { message: 'Usuario marcado como eliminado correctamente' };
  }


  async reactivate(id: string): Promise<{ message: string; user: User }> {
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (user.status === UserStatus.ACTIVE) {
      return { message: 'La cuenta ya está activa', user };
    }

    user.status = UserStatus.ACTIVE;
    await this.userRepository.save(user);

    return { message: 'Cuenta reactivada correctamente', user };
  }

}
