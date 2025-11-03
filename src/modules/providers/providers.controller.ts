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
import { ProvidersService } from './providers.service';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { Role } from 'src/modules/auth/roles.enum';
import { ProviderStatus } from './enums/provider-status.enum';
import { UpdateProviderDto } from './dto/update-provider.dto';

@Controller('providers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  // Listar todos los proveedores (solo administrador)
  @Get()
  @Roles(Role.Admin)
  findAll(@Query('status') status?: ProviderStatus) {
    return this.providersService.findAll(status);
  }

  // Obtener un proveedor por ID (solo admin o el propio proveedor)
  @Get(':id')
  @Roles(Role.Admin, Role.Provider)
  async findOne(@Param('id') id: string, @Req() req) {
    const currentUser = req.user;

    if (currentUser.role !== Role.Admin && currentUser.id !== id) {
      throw new ForbiddenException(
        'No tienes permiso para acceder a este perfil de proveedor',
      );
    }

    return this.providersService.findOne(id);
  }

  // Actualizar datos del proveedor (solo admin o el propio proveedor)
  @Patch(':id')
  @Roles(Role.Admin, Role.Provider)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProviderDto,
    @Req() req,
  ) {
    const currentUser = req.user;

    if (currentUser.role !== Role.Admin && currentUser.id !== id) {
      throw new ForbiddenException(
        'No tienes permiso para modificar este perfil',
      );
    }

    const safeData = { ...dto };

    // Si no es admin, no puede cambiar su rol
    if (currentUser.role !== Role.Admin) {
      delete safeData.role;
    }

    delete safeData.email; // opcional
    delete safeData.status; // opcional

    const updated = await this.providersService.update(id, safeData);
    return {
      message: 'Proveedor actualizado correctamente',
      provider: updated,
    };
  }

  @Patch('complete/:id')
  @Roles(Role.Provider, Role.Admin)
  async completeProfile(
    @Param('id') id: string,
    @Body() dto: UpdateProviderDto,
    @Req() req,
  ) {
    const currentUser = req.user;

    if (currentUser.role !== Role.Admin && currentUser.id !== id) {
      throw new ForbiddenException('No tienes permiso para completar este perfil');
    }

    const { email, role, status, ...safeData } = dto as any;

    const updated = await this.providersService.update(id, {
      ...safeData,
      isCompleted: true,
    });

    return {
      message: 'Perfil de proveedor completado correctamente',
      provider: updated,
    };
  }


  // Desactivar (soft delete) proveedor
  @Delete(':id')
  @Roles(Role.Admin, Role.Provider)
  async remove(@Param('id') id: string, @Req() req) {
    const currentUser = req.user;

    if (currentUser.role !== Role.Admin && currentUser.id !== id) {
      throw new ForbiddenException('No tienes permiso para eliminar este perfil');
    }

    return this.providersService.remove(id);
  }

  // Reactivar proveedor
  @Patch(':id/reactivate')
  @Roles(Role.Admin, Role.Provider)
  async reactivate(@Param('id') id: string, @Req() req) {
    const currentUser = req.user;

    if (currentUser.role !== Role.Admin && currentUser.id !== id) {
      throw new ForbiddenException('No tienes permiso para reactivar esta cuenta');
    }

    return this.providersService.reactivate(id);
  }
}
