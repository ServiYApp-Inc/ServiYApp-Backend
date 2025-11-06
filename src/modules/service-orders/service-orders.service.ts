import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceOrder } from './entities/service-order.entity';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { Provider } from 'src/modules/providers/entities/provider.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Service } from 'src/modules/services/entities/service.entity';
import { Address } from 'src/modules/addresses/entities/address.entity';
@Injectable()
export class ServiceOrdersService {
  constructor(
    @InjectRepository(ServiceOrder)
    private readonly serviceOrderRepository: Repository<ServiceOrder>,

    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,

    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
  ) {}

  async create(
    createServiceOrderDto: CreateServiceOrderDto,
  ): Promise<ServiceOrder> {
    const { providerId, userId, serviceId, addressId, status } =
      createServiceOrderDto;

    // Validar que las relaciones existan
    const provider = await this.providerRepository.findOne({
      where: { id: providerId },
    });
    if (!provider) throw new NotFoundException('Proveedor no encontrado');

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const service = await this.serviceRepository.findOne({
      where: { id: serviceId },
    });
    if (!service) throw new NotFoundException('Servicio no encontrado');

    const address = await this.addressRepository.findOne({
      where: { id: addressId },
    });
    if (!address) throw new NotFoundException('Dirección no encontrada');

    // Crear la orden
    const newOrder = this.serviceOrderRepository.create({
      provider,
      user,
      service,
      address,
      status: status || 'pending',
    });

    // Guardar en la base de datos
    return await this.serviceOrderRepository.save(newOrder);
  }

  async findAll(): Promise<ServiceOrder[]> {
    return await this.serviceOrderRepository.find({
      relations: ['provider', 'user', 'service', 'address', 'payments'],
      order: { createdAt: 'DESC' }, // Ordena de la más reciente a la más antigua
    });
  }

  async findOne(id: string): Promise<ServiceOrder> {
    const serviceOrder = await this.serviceOrderRepository.findOne({
      where: { id },
      relations: ['provider', 'user', 'service', 'address', 'payments'],
    });

    if (!serviceOrder) {
      throw new NotFoundException(
        `La orden de servicio con id ${id} no existe`,
      );
    }

    return serviceOrder;
  }

  //buscar ordenes por proveedor
  async findByProvider(providerId: string): Promise<ServiceOrder[]> {
    const provider = await this.providerRepository.findOne({
      where: { id: providerId },
    });
    if (!provider) throw new NotFoundException('Proveedor no encontrado');

    const orders = await this.serviceOrderRepository.find({
      where: { provider: { id: providerId } },
      relations: ['provider', 'user', 'service', 'address', 'payments'],
      order: { createdAt: 'DESC' },
    });

    return orders;
  }

  //buscar ordenes por usuario
  async findByUser(userId: string): Promise<ServiceOrder[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const orders = await this.serviceOrderRepository.find({
      where: { user: { id: userId } },
      relations: ['provider', 'user', 'service', 'address', 'payments'],
      order: { createdAt: 'DESC' },
    });

    return orders;
  }

  //convertir a orden cancelada
  async cancelOrder(id: string): Promise<ServiceOrder> {
    const order = await this.serviceOrderRepository.findOne({ where: { id } });

    if (!order) {
      throw new NotFoundException(`La orden con ID ${id} no existe`);
    }

    if (order.status === 'cancelled') {
      throw new BadRequestException('La orden ya está cancelada');
    }

    // Actualizar el estado
    order.status = 'cancelled';
    await this.serviceOrderRepository.save(order);

    return order;
  }

  //cuando el prestador de servicio confirma la orden
  async confirmOrder(id: string): Promise<ServiceOrder> {
    const order = await this.serviceOrderRepository.findOne({ where: { id } });

    if (!order) {
      throw new NotFoundException(`La orden con ID ${id} no existe`);
    }

    if (order.status === 'accepted') {
      throw new BadRequestException('La orden ya está comfirmada');
    }

    // Actualizar el estado
    order.status = 'accepted';
    await this.serviceOrderRepository.save(order);

    return order;
  }

  //cuando el prestador de servicio ya completa la orden
  async finishOrder(id: string): Promise<ServiceOrder> {
    const order = await this.serviceOrderRepository.findOne({ where: { id } });

    if (!order) {
      throw new NotFoundException(`La orden con ID ${id} no existe`);
    }

    if (order.status === 'completed') {
      throw new BadRequestException('La orden ya está finalizada');
    }

    // Actualizar el estado
    order.status = 'completed';
    await this.serviceOrderRepository.save(order);

    return order;
  }
}
