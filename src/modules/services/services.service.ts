import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Provider } from '../providers/entities/provider.entity';
import { Category } from '../categories/entities/category.entity';
import { Role } from '../auth/roles.enum';
import { ServiceStatus } from './enums/service-status.enum';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  // Crear un nuevo servicio
  async create(dto: CreateServiceDto, user: any): Promise<Service> {
    const provider = user.role === Role.Admin
      ? await this.providerRepository.findOne({ where: { id: dto.providerId } })
      : await this.providerRepository.findOne({ where: { email: user.email } });

    if (!provider) throw new NotFoundException('Proveedor no encontrado');

    const category = await this.categoryRepository.findOne({
      where: { id: dto.categoryId },
    });
    if (!category) throw new NotFoundException('Categoría no encontrada');

    const service = this.serviceRepository.create({
      name: dto.name,
      description: dto.description,
      photo: dto.photo,
      duration: dto.duration,
      provider,
      category,
      status: ServiceStatus.ACTIVE,
    });

    return await this.serviceRepository.save(service);
  }

  // Ver todos los servicios (admin o proveedor)
  async findAllPublic(): Promise<Service[]> {
    return await this.serviceRepository.find({
      relations: ['provider', 'category'],
      order: { createdAt: 'DESC' },
    });
  }

  // Ordenar por Parametro ('price' o 'duration')
  async findAllBy(param: string): Promise<Service[]> {
    return await this.serviceRepository.find({
      relations: ['provider', 'category'],
      order: { [param]: 'ASC' }
    })
  }

  async filteredFind({country, region, city}) {
    const services = await this.serviceRepository.find({
      relations: [
        'provider',
        'provider.country',
        'provider.region',
        'provider.city',
        'category'
      ],
      where: { status: ServiceStatus.ACTIVE }
    });

    return services.filter(service => {
      const matchesCountry = country ? service.provider.country?.name === country : true;
      const matchesRegion = region ? service.provider.region?.name === region : true;
      const matchesCity = city ? service.provider.city?.name === city : true;
      return matchesCountry && matchesRegion && matchesCity;
    });
  }

  // Buscar por ID (control de acceso)
  async findOnePublic(id: string): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: { id },
      relations: ['provider', 'category'],
    });
    if (!service) throw new NotFoundException('Servicio no encontrado');
    return service;
  }

  // Método interno con validación de permisos
  private async findOne(id: string, user: any): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: { id },
      relations: ['provider', 'category'],
    });

    if (!service) throw new NotFoundException('Servicio no encontrado');

    // Verifica permisos
    if (user.role !== Role.Admin && service.provider.email !== user.email) {
      throw new ForbiddenException('No tienes permiso para acceder a este servicio.');
    }

    return service;
  }

  // Actualizar (admin o propietario)
  async update(id: string, dto: UpdateServiceDto, user: any): Promise<Service> {
    const service = await this.findOne(id, user);

    if (dto.providerId && user.role === Role.Admin) {
      const provider = await this.providerRepository.findOne({
        where: { id: dto.providerId },
      });
      if (!provider) throw new NotFoundException('Proveedor no encontrado');
      service.provider = provider;
    }

    if (dto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: dto.categoryId },
      });
      if (!category) throw new NotFoundException('Categoría no encontrada');
      service.category = category;
    }

    Object.assign(service, dto);
    return await this.serviceRepository.save(service);
  }

  // Cambiar estado (activar/desactivar)
  async changeStatus(id: string, user: any, status: ServiceStatus): Promise<Service> {
    const service = await this.findOne(id, user);
    service.status = status;
    return await this.serviceRepository.save(service);
  }
}
