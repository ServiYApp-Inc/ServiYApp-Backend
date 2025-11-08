import { Controller, Post, Body, Logger } from '@nestjs/common';
import { MercadoPagoService } from './mercadopago.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly mercadoPagoService: MercadoPagoService,
    private readonly paymentsService: PaymentsService,
  ) {}

  /**
   * 🧾 Crear preferencia en Mercado Pago
   * Retorna el init_point (URL de pago)
   */
  @Post('create-preference')
  async createPreference(@Body() createPaymentDto: CreatePaymentDto) {
    try {
      const preferenceData = {
        items: [
          {
            title: createPaymentDto.description || 'Servicio de belleza',
            quantity: 1,
            currency_id: createPaymentDto.currency || 'COP',
            unit_price: createPaymentDto.amount,
          },
        ],
        payer: {
          email: createPaymentDto.payerEmail,
        },
        back_urls: {
          success: 'https://serviyapp-frontend.vercel.app/payment/success',
          failure: 'https://serviyapp-frontend.vercel.app/payment/failure',
          pending: 'https://serviyapp-frontend.vercel.app/payment/pending',
        },
        auto_return: 'approved',
      };

      // Llama al servicio para crear la preferencia en Mercado Pago
      const preference =
        await this.mercadoPagoService.createPreference(preferenceData);

      // Guarda el pago en tu base de datos (opcional)
      const newPayment = await this.paymentsService.create({
        ...createPaymentDto,
        mpPreferenceId: preference.id,
        status: 'pending',
      });

      return {
        message: 'Preferencia creada exitosamente',
        init_point: preference.init_point, // URL para redirigir al cliente
        preference_id: preference.id,
        payment: newPayment,
      };
    } catch (error) {
      this.logger.error('Error creando preferencia de pago', error);
      throw error;
    }
  }

  /**
   * 📄 Obtener un pago por ID
   */
  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.paymentsService..findOne(id);
  // }
}
