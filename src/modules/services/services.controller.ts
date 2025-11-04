import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles.enum';
import { ServiceStatus } from './enums/service-status.enum';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  // PÚBLICOS
  @Get('find-all')
  findAll() {
    return this.servicesService.findAllPublic();
  }

  @Get('find/:id')
  findOne(@Param('id') id: string) {
    return this.servicesService.findOnePublic(id);
  }

  // PROTEGIDOS
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('create')
  @Roles(Role.Provider, Role.Admin)
  create(@Body() dto: CreateServiceDto, @Req() req) {
    return this.servicesService.create(dto, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('update/:id')
  @Roles(Role.Provider, Role.Admin)
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto, @Req() req) {
    return this.servicesService.update(id, dto, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('deactivate/:id')
  @Roles(Role.Provider, Role.Admin)
  deactivate(@Param('id') id: string, @Req() req) {
    return this.servicesService.changeStatus(id, req.user, ServiceStatus.INACTIVE);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('activate/:id')
  @Roles(Role.Provider, Role.Admin)
  activate(@Param('id') id: string, @Req() req) {
    return this.servicesService.changeStatus(id, req.user, ServiceStatus.ACTIVE);
  }
}
