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
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from 'src/modules/auth/auth.service';


@Controller('providers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProvidersController {
  constructor(
    private readonly providersService: ProvidersService,
    private readonly authService: AuthService, 
  ) {}

  // Listar todos los proveedores (solo administrador)
  @ApiBearerAuth()
  @Get()
  // Aprobar o rechazar documentos de un proveedor (solo admin)
  @Patch(':id/validate')
  @Roles(Role.Admin)
  async validateDocuments(
    @Param('id') id: string,
    @Body('isApproved') isApproved: boolean,
  ) {
    const result = await this.providersService.validateDocuments(id, isApproved);
    return result;
  }

  // Cambiar el estado de un proveedor (solo admin)
  @Patch(':id/status')
  @Roles(Role.Admin)
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: ProviderStatus,
  ) {
    return this.providersService.updateStatus(id, status);
  }

  // Listar todos los proveedores
  @Get()
  findAll(@Query('status') status?: ProviderStatus) {
    return this.providersService.findAll(status);
  }

  // Obtener un proveedor por ID (solo admin o el propio proveedor)
  @ApiBearerAuth()
  @Get(':id')
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
  @ApiBearerAuth()
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

  @ApiBearerAuth()
  @Patch('complete/:id')
  @Roles(Role.Provider, Role.Admin)
  async completeProfile(
    @Param('id') id: string,
    @Body() dto: UpdateProviderDto,
    @Req() req,
  ) {
    const currentUser = req.user;

    // Solo el propio proveedor o el admin pueden completar su perfil
    if (currentUser.role !== Role.Admin && currentUser.id !== id) {
      throw new ForbiddenException('No tienes permiso para completar este perfil');
    }

    const result = await this.authService.completeRegisterProvider(id, dto);
    return result;
  }

  // Desactivar (soft delete) proveedor
  @ApiBearerAuth()
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
  @ApiBearerAuth()
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
