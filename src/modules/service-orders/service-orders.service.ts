import { Injectable } from '@nestjs/common';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { UpdateServiceOrderDto } from './dto/update-service-order.dto';

@Injectable()
export class ServiceOrdersService {
  create(createServiceOrderDto: CreateServiceOrderDto) {
    return 'This action adds a new serviceOrder';
  }

  findAll() {
    return `This action returns all serviceOrders`;
  }

  findOne(id: number) {
    return `This action returns a #${id} serviceOrder`;
  }

  update(id: number, updateServiceOrderDto: UpdateServiceOrderDto) {
    return `This action updates a #${id} serviceOrder`;
  }

  remove(id: number) {
    return `This action removes a #${id} serviceOrder`;
  }
}
