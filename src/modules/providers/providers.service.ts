import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Provider } from './entities/provider.entity';
import { ProviderStatus } from './enums/provider-status.enum';
import { Country } from 'src/modules/locations/entities/country.entity';
import { Region } from 'src/modules/locations/entities/region.entity';
import { City } from 'src/modules/locations/entities/city.entity';

@Injectable()
export class ProvidersService {
  constructor(
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,

    @InjectRepository(Country)
    private readonly countryRepo: Repository<Country>,

    @InjectRepository(Region)
    private readonly regionRepo: Repository<Region>,

    @InjectRepository(City)
    private readonly cityRepo: Repository<City>,
  ) {}

  // Buscar proveedor por correo electrónico (findOne)
  async findByEmail(email: string): Promise<Provider | null> {
    if (!email) return null;
    return this.providerRepository.findOne({
      where: { email: email.trim().toLowerCase() },
      relations: ['country', 'region', 'city'],
    });
  }

  // Buscar proveedor por username (findOne)
  async findByUsername(userName: string): Promise<Provider | null> {
    if (!userName) return null;
    return this.providerRepository.findOne({
      where: { userName },
    });
  }

// Buscar proveedor por ID
async findOne(id: string): Promise<Provider> {
  const provider = await this.providerRepository.findOne({
    where: { id },
    relations: ['country', 'region', 'city'],
  });
  if (!provider)
    throw new NotFoundException(`Proveedor con ID ${id} no encontrado`);
  return provider;
}

  // Validar coherencia país → región → ciudad
  private async validateLocation(
    countryId?: string,
    regionId?: string,
    cityId?: string,
  ) {
    if (!countryId || !regionId || !cityId) {
      throw new BadRequestException(
        'Debe seleccionar país, región y ciudad válidos.',
      );
    }

    const country = await this.countryRepo.findOne({ where: { id: countryId } });
    if (!country) throw new BadRequestException('El país no existe.');

    const region = await this.regionRepo.findOne({
      where: { id: regionId, country: { id: country.id } },
    });
    if (!region)
      throw new BadRequestException(
        'La región no pertenece al país seleccionado.',
      );

    const city = await this.cityRepo.findOne({
      where: { id: cityId, region: { id: region.id } },
    });
    if (!city)
      throw new BadRequestException(
        'La ciudad no pertenece a la región seleccionada.',
      );

    return { country, region, city };
  }

  // Crear proveedor
  async create(data: any): Promise<Provider> {
    try {
      const { countryId, regionId, cityId, ...rest } = data;

      const { country, region, city } = await this.validateLocation(
        countryId,
        regionId,
        cityId,
      );

      const provider = this.providerRepository.create({
        ...rest,
        country,
        region,
        city,
        status: ProviderStatus.PENDING,
        isCompleted: false,
        registrationDate: new Date(),
      }) as unknown as Provider;

      if (data.password) {
        const saltRounds = 10;
        provider.password = await bcrypt.hash(data.password, saltRounds);
      }

      const saved = await this.providerRepository.save(provider);
      return saved;
    } catch (error) {
      throw new BadRequestException(
        'Error al crear el proveedor: ' + error.message,
      );
    }
  }




  // Obtener todos
  async findAll(status?: ProviderStatus): Promise<Provider[]> {
    const where = status ? { status } : {};
    return this.providerRepository.find({
      where,
      order: { registrationDate: 'DESC' },
      relations: ['country', 'region', 'city'],
    });
  }

  // Actualizar
  async update(id: string, data: any): Promise<Provider> {
    const provider = await this.findOne(id);

    if (data.password) {
      const saltRounds = 10;
      data.password = await bcrypt.hash(data.password, saltRounds);
    }

    if (data.countryId || data.regionId || data.cityId) {
      const { country, region, city } = await this.validateLocation(
        data.countryId ?? provider.country.id,
        data.regionId ?? provider.region.id,
        data.cityId ?? provider.city.id,
      );

      provider.country = country;
      provider.region = region;
      provider.city = city;
    }

    Object.assign(provider, data);
    return await this.providerRepository.save(provider);
  }

  // Eliminar lógico
  async remove(id: string): Promise<{ message: string }> {
    const provider = await this.findOne(id);
    provider.status = ProviderStatus.DELETED;
    await this.providerRepository.save(provider);
    return { message: 'Proveedor marcado como eliminado correctamente' };
  }

  // Reactivar
  async reactivate(id: string): Promise<{ message: string; provider: Provider }> {
    const provider = await this.findOne(id);
    if (provider.status === ProviderStatus.ACTIVE) {
      return { message: 'La cuenta ya está activa', provider };
    }

    provider.status = ProviderStatus.ACTIVE;
    await this.providerRepository.save(provider);

    return { message: 'Cuenta reactivada correctamente', provider };
  }
}
