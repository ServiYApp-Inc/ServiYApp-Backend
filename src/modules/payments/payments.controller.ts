import {
  Controller,
  Post,
  Body,
  Logger,
  Get,
  Query,
  Res,
  HttpStatus,
} from '@nestjs/common';
import express from 'express';
import { MercadoPagoService } from './mercadopago.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';
import MercadoPagoConfig, { MerchantOrder } from 'mercadopago';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  private client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || 'APP_USR-xxxxxxxxxxxxxxxxxxxx',
  });

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
            title: createPaymentDto.description,
            quantity: 1,
            currency_id: createPaymentDto.currency || 'COP',
            unit_price: createPaymentDto.amount,
          },
        ],
        payer: {
          email: createPaymentDto.payerEmail,
        },
        back_urls: {
          success: 'https://3t9zc8rg-3000.use.devtunnels.ms/payments/success',
          failure: 'https://3t9zc8rg-3000.use.devtunnels.ms/payments/failure',
          pending: 'https://3t9zc8rg-3000.use.devtunnels.ms/payments/pending',
        },
        external_reference: 'user_123456',
        notification_url:
          'https://3t9zc8rg-4000.use.devtunnels.ms/payments/webhook',
        auto_return: 'approved',
        binary_mode: true,
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

  @Get('success')
  success() {
    return { message: 'Pago exitoso' };
  }

  @Get('failure')
  failure() {
    return { message: 'Pago fallido' };
  }

  @Get('pending')
  pending() {
    return { message: 'Pago pendiente' };
  }

  @Post('webhook')
  async receiveWebhook(
    @Query() query: any,
    @Body() body: any,
    @Res() res: express.Response,
  ) {
    try {
      this.logger.log('Webhook recibido:', query);

      const { id, topic } = query;

      // ✅ Caso 1: webhook de pago directo
      if (topic === 'payment') {
        this.logger.log(`🔔 Notificación de pago recibida: ${id}`);

        const payment = await fetch(
          `https://api.mercadopago.com/v1/payments/${id}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
            },
          },
        ).then((r) => r.json());

        this.logger.log('💳 Detalle del pago:', payment);

        if (payment.status === 'approved') {
          this.logger.log('✅ Pago aprobado');
          // Aquí actualizas tu base de datos o lógica de negocio
        } else if (payment.status === 'pending') {
          this.logger.log('⏳ Pago pendiente');
        } else {
          this.logger.log('❌ Pago rechazado');
        }
      }

      // ✅ Caso 2: webhook de merchant_order (orden)
      if (topic === 'merchant_order') {
        const merchantOrder = new MerchantOrder(this.client);
        const response = await merchantOrder.get({ merchantOrderId: id });

        this.logger.log('🧾 Detalle de la orden:', response);

        const payments = response.payments ?? [];
        if (payments.length > 0) {
          const payment = payments[0];
          if (payment.status === 'approved') {
            this.logger.log('✅ Pago aprobado desde orden');
          } else if (payment.status === 'pending') {
            this.logger.log('⏳ Pago pendiente desde orden');
          } else {
            this.logger.log('❌ Pago rechazado desde orden');
          }
        } else {
          this.logger.warn('⚠️ No se encontraron pagos en la orden');
        }
      }

      return res.status(HttpStatus.OK).send('Webhook procesado');
    } catch (error) {
      this.logger.error('Error en webhook:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Error interno');
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
