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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { Role } from 'src/modules/auth/roles.enum';
import { UserStatus } from './enums/user-status.enum';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';



// Controlador encargado de la gestión de usuarios.
// Permite listar, consultar, actualizar y eliminar perfiles.
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Listar todos los usuarios (solo administrador).
  @Get()
  @Roles(Role.Admin)
  findAll(@Query('status') status?: UserStatus) {
    return this.usersService.findAll(status);
  }

  // Obtener un usuario por ID (solo administrador y propio usuario).
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
    delete safeData.isCompleted;

    const updatedUser = await this.usersService.update(id, safeData);

    return {
      message: 'Usuario actualizado correctamente',
      user: updatedUser,
    };
  }


  // Completar registro tras autenticación con Google.
  // Permite completar datos faltantes y marcar el perfil como completo.
  @Patch('complete/:id')
  @Roles(Role.User, Role.Admin)
  async completeProfile(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Req() req,
  ) {
    const currentUser = req.user;
    if (currentUser.role !== Role.Admin && currentUser.id !== id)
      throw new ForbiddenException('No tienes permiso para completar este perfil');

    const { email, role, isCompleted, ...safeData } = dto as any;

    const updatedUser = await this.usersService.update(id, {
      ...safeData,
      isCompleted: true,
    });

    return {
      message: 'Perfil completado correctamente',
      user: updatedUser,
    };
  }

  // Eliminar (desactivar) un usuario.
  // Solo el propio usuario o el administrador pueden hacerlo.
  // Se marca el estado como DELETED (eliminación lógica).
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
  @Patch(':id/reactivate')
  @Roles(Role.Admin, Role.User)
  async reactivate(@Param('id') id: string, @Req() req) {
    const currentUser = req.user;

    if (currentUser.role !== Role.Admin && currentUser.id !== id) {
      throw new ForbiddenException('No tienes permiso para reactivar esta cuenta');
    }
    
    return this.usersService.reactivate(id);
  }

}
