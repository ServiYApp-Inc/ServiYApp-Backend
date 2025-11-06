import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
  Query,
  UseInterceptors,
  ParseUUIDPipe,
  UploadedFile,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { Role } from 'src/modules/auth/roles.enum';
import { UserStatus } from './enums/user-status.enum';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from 'src/modules/cloudinary/cloudinary.service';


// Controlador encargado de la gestión de usuarios.
// Permite listar, consultar, actualizar y eliminar perfiles.
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}



  @UseGuards(JwtAuthGuard)
  @Patch(':id/upload-profile')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfilePicture(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ) {
    const requester = req.user; // viene del token JWT

    // Permitir si el usuario sube su propia foto
    const isSelf = requester.id === id;

    // Permitir si es administrador
    const isAdmin = requester.role === Role.Admin;

    if (!isSelf && !isAdmin) {
      throw new ForbiddenException('No tienes permisos para modificar esta foto de perfil');
    }

    // Subir imagen a Cloudinary
    const uploadResult = await this.cloudinaryService.uploadImage(file);

    // Actualizar en la BD
    const user = await this.usersService.update(id, {
      profilePicture: uploadResult.secure_url,
    });

    return {
      message: isAdmin
        ? 'Foto de perfil actualizada por el administrador'
        : 'Tu foto de perfil se actualizó correctamente',
      profilePicture: uploadResult.secure_url,
      user,
    };
  }

  
  // Listar todos los usuarios (solo administrador).
  @ApiBearerAuth()
  @Get()
  @Roles(Role.Admin)
  findAll(@Query('status') status?: UserStatus) {
    return this.usersService.findAll(status);
  }

  // Obtener un usuario por ID (solo administrador y propio usuario).
  @ApiBearerAuth()
  @Get(':id')
  @Roles(Role.Admin, Role.User)
  async findOne(@Param('id') id: string, @Req() req) {
    const currentUser = req.user;

    // Solo el propio usuario o el admin pueden ver los datos
    if (currentUser.role !== Role.Admin && currentUser.id !== id) {
      throw new ForbiddenException('No tienes permiso para acceder a este perfil');
    }

    return this.usersService.findOne(id);
  }

  // Actualizar perfil general del usuario.
  // Solo el propio usuario o un administrador pueden modificarlo.
  @ApiBearerAuth()
  @Patch(':id')
  @Roles(Role.Admin, Role.User)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Req() req,
  ) {
    const user = req.user;

    // Solo el propio usuario o un admin pueden modificarlo
    if (user.role !== Role.Admin && user.id !== id)
      throw new ForbiddenException('No tienes permiso para modificar este perfil');

    // Construimos los campos editables dinámicamente
    const safeData: any = { ...dto };

    // Si el usuario NO es admin → no puede tocar su rol
    if (user.role !== Role.Admin) {
      delete safeData.role;
    }

    // Evitar que cualquiera (ni admin) cambie email manualmente (opcional)
    delete safeData.email;

    const updatedUser = await this.usersService.update(id, safeData);

    return {
      message: 'Usuario actualizado correctamente',
      user: updatedUser,
    };
  }

  // Completar registro tras autenticación con Google.
  // Cambia el estado del usuario de INCOMPLETE → ACTIVE.
  @ApiBearerAuth()
  @Patch('complete/:id')
  @Roles(Role.User, Role.Admin)
  async completeProfile(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Req() req,
  ) {
    const currentUser = req.user;

    // Solo el propio usuario o el admin pueden completar su perfil
    if (currentUser.role !== Role.Admin && currentUser.id !== id)
      throw new ForbiddenException('No tienes permiso para completar este perfil');

    const { email, role, ...safeData } = dto as any;

    const updatedUser = await this.usersService.update(id, {
      ...safeData,
      status: UserStatus.ACTIVE, // 🔥 cambia el estado
    });

    return {
      message: 'Perfil completado correctamente',
      user: updatedUser,
    };
  }

  // Eliminar (desactivar) un usuario.
  // Solo el propio usuario o el administrador pueden hacerlo.
  // Se marca el estado como DELETED (eliminación lógica).
  @ApiBearerAuth()
  @Delete(':id')
  @Roles(Role.Admin, Role.User)
  async remove(@Param('id') id: string, @Req() req) {
    const currentUser = req.user;

    // Solo el propio usuario o el admin pueden eliminar
    if (currentUser.role !== Role.Admin && currentUser.id !== id) {
      throw new ForbiddenException('No tienes permiso para eliminar este usuario');
    }

    return this.usersService.remove(id);
  }
  
  // Reactivar un usuario (solo el propio usuario o un administrador)
  @ApiBearerAuth()
  @Patch(':id/reactivate')
  @Roles(Role.Admin, Role.User)
  async reactivate(@Param('id') id: string, @Req() req) {
    const currentUser = req.user;

    const userToReactivate = await this.usersService.findOne(id);

    // Si el usuario está suspendido → no permitir reactivación
    if (userToReactivate.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('No puedes reactivar una cuenta suspendida.');
    }

    // Solo el propio usuario o el admin pueden hacerlo
    if (currentUser.role !== Role.Admin && currentUser.id !== id) {
      throw new ForbiddenException('No tienes permiso para reactivar esta cuenta');
    }

    return this.usersService.reactivate(id);
  }

}
