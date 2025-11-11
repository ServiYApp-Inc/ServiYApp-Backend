import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ServiceOrder } from '../service-orders/entities/service-order.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,

    @InjectRepository(ServiceOrder)
    private readonly serviceOrdersRepository: Repository<ServiceOrder>,
  ) {}

  /**
   * 🧾 Crear un nuevo registro de pago
   */
  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const { serviceOrderId, ...paymentData } = createPaymentDto;

    // Verificar que la orden de servicio exista
    const serviceOrder = await this.serviceOrdersRepository.findOne({
      where: { id: serviceOrderId },
    });

    if (!serviceOrder) {
      throw new NotFoundException('Service order not found');
    }

    // Crear el registro de pago
    const newPayment = this.paymentsRepository.create({
      ...paymentData,
      serviceOrder,
    });

    return this.paymentsRepository.save(newPayment);
  }

  /**
   * 📄 Obtener un pago por ID
   */
  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentsRepository.findOne({
      where: { id },
      relations: ['serviceOrder'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  /**
   * 🔍 Obtener todos los pagos (opcional)
   */
  async findAll(): Promise<Payment[]> {
    return this.paymentsRepository.find({ relations: ['serviceOrder'] });
  }

  /**
   * 🔄 Actualizar el estado del pago
   */
  async updateStatus(id: string, status: string): Promise<Payment> {
    const payment = await this.findOne(id);
    payment.status = status;
    return this.paymentsRepository.save(payment);
  }
}
