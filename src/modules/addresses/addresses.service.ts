import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './entities/address.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { Country } from 'src/modules/locations/entities/country.entity';
import { Region } from 'src/modules/locations/entities/region.entity';
import { City } from 'src/modules/locations/entities/city.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Role } from 'src/modules/auth/roles.enum';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepo: Repository<Address>,
    @InjectRepository(Country)
    private readonly countryRepo: Repository<Country>,
    @InjectRepository(Region)
    private readonly regionRepo: Repository<Region>,
    @InjectRepository(City)
    private readonly cityRepo: Repository<City>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(dto: CreateAddressDto, currentUser: any) {
    const [country, region, city] = await Promise.all([
      this.countryRepo.findOneBy({ id: dto.countryId }),
      this.regionRepo.findOneBy({ id: dto.regionId }),
      this.cityRepo.findOneBy({ id: dto.cityId }),
    ]);

    if (!country || !region || !city)
      throw new NotFoundException('Invalid location data.');

    const user = await this.userRepo.findOneBy({ id: currentUser.id });
    if (!user) throw new NotFoundException('User not found.');

    const newAddress = this.addressRepo.create({
      ...dto,
      user,
      country,
      region,
      city,
      status: true,
    });
    return this.addressRepo.save(newAddress);
  }

  async findAll(currentUser: any) {
    const filter =
      currentUser.role === Role.Admin ? {} : { user: { id: currentUser.id } };

    return this.addressRepo.find({
      where: filter,
      relations: ['country', 'region', 'city', 'user'],
    });
  }

  async findOne(id: string, currentUser: any) {
    const address = await this.addressRepo.findOne({
      where: { id },
      relations: ['country', 'region', 'city', 'user'],
    });
    if (!address) throw new NotFoundException('Address not found.');
    if (
      currentUser.role !== Role.Admin &&
      address.user.id !== currentUser.id
    ) {
      throw new ForbiddenException('Access denied to this address.');
    }
    return address;
  }

  async update(id: string, dto: UpdateAddressDto, currentUser: any) {
    const address = await this.findOne(id, currentUser);
    Object.assign(address, dto);
    return this.addressRepo.save(address);
  }

  async deactivate(id: string, currentUser: any) {
    const address = await this.findOne(id, currentUser);
    address.status = false;
    return this.addressRepo.save(address);
  }

  async reactivate(id: string, currentUser: any) {
    const address = await this.findOne(id, currentUser);
    address.status = true;
    return this.addressRepo.save(address);
  }
}
