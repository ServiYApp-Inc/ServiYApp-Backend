import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { ServiceOrder } from '../../modules/service-orders/entities/service-order.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { Provider } from '../providers/entities/provider.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(ServiceOrder)
    private readonly orderRepo: Repository<ServiceOrder>,
    @InjectRepository(Provider)
    private readonly providerRepo: Repository<Provider>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // Crear reseña para proveedor
  async createReviewProvider(
    dto: CreateReviewDto,
    files?: Express.Multer.File[],
  ) {
    const validCombo =
      (dto.authorUserId && dto.targetProviderId) ||
      (dto.authorProviderId && dto.targetUserId);

    if (!validCombo) {
      throw new BadRequestException(
        'Debe especificar un autor y destinatario válidos (user->provider o provider->user)',
      );
    }

    const order = await this.orderRepo.findOne({ where: { id: dto.orderId } });
    if (!order) throw new NotFoundException('Orden no encontrada');

    const existing = await this.reviewRepo.find({
      where: { orderId: dto.orderId },
    });

    if (dto.authorUserId && existing.some((r) => !!r.authorUserId)) {
      throw new BadRequestException('El cliente ya calificó esta orden.');
    }

    if (dto.authorProviderId && existing.some((r) => !!r.authorProviderId)) {
      throw new BadRequestException('El proveedor ya calificó esta orden.');
    }

    const photoUrl = files?.length
      ? await this.handlePhotoUploads(files)
      : dto.photoUrl || null;

    const review = this.reviewRepo.create({
      ...dto,
      photoUrl: photoUrl ?? undefined,
    });

    const savedReview = await this.reviewRepo.save(review);

    // ⭐ Calcular promedio actualizado

    if (!dto.targetProviderId) {
      throw new BadRequestException(
        'El ID del proveedor no puede ser undefined',
      );
    }
    const updatedAverage = await this.getAverageRatingForProvider(
      dto.targetProviderId,
    );

    // 🔢 Contar total de reviews del proveedor
    const totalReviews = await this.reviewRepo.count({
      where: { targetProviderId: dto.targetProviderId },
    });

    // 🛠 Actualizar proveedor
    await this.providerRepo.update(dto.targetProviderId, {
      averageRating: updatedAverage,
      reviewsCount: totalReviews,
    });

    return {
      message: 'Reseña creada exitosamente',
      review: savedReview,
      averageRating: updatedAverage,
      reviewsCount: totalReviews,
    };
  }

  // Crear reseña para proveedor
  // async createReviewProvider(dto: CreateReviewDto) {
  //   // Validar combinación de autor y destinatario
  //   const validCombo =
  //     (dto.authorUserId && dto.targetProviderId) ||
  //     (dto.authorProviderId && dto.targetUserId);

  //   if (!validCombo) {
  //     throw new BadRequestException(
  //       'Debe especificar un autor y destinatario válidos (user->provider o provider->user)',
  //     );
  //   }

  //   const order = await this.orderRepo.findOne({ where: { id: dto.orderId } });
  //   if (!order) throw new NotFoundException('Orden no encontrada');

  //   //Validar si ya existe review
  //   const existingReviews = await this.reviewRepo.find({
  //     where: { orderId: dto.orderId },
  //   });

  //   if (dto.authorUserId && existingReviews.some((r) => !!r.authorUserId)) {
  //     throw new BadRequestException('El cliente ya calificó esta orden.');
  //   }

  //   if (
  //     dto.authorProviderId &&
  //     existingReviews.some((r) => !!r.authorProviderId)
  //   ) {
  //     throw new BadRequestException('El proveedor ya calificó esta orden.');
  //   }

  //   const review = this.reviewRepo.create(dto);
  //   return await this.reviewRepo.save(review);
  // }

  // Crear reseña para cliente
  async createReviewClient(
    dto: CreateReviewDto,
    files?: Express.Multer.File[],
  ) {
    const validCombo =
      (dto.authorUserId && dto.targetProviderId) ||
      (dto.authorProviderId && dto.targetUserId);

    if (!validCombo) {
      throw new BadRequestException(
        'Debe especificar un autor y destinatario válidos (user->provider o provider->user)',
      );
    }

    const order = await this.orderRepo.findOne({ where: { id: dto.orderId } });
    if (!order) throw new NotFoundException('Orden no encontrada');

    const existing = await this.reviewRepo.find({
      where: { orderId: dto.orderId },
    });

    if (dto.authorUserId && existing.some((r) => !!r.authorUserId)) {
      throw new BadRequestException('El cliente ya calificó esta orden.');
    }

    if (dto.authorProviderId && existing.some((r) => !!r.authorProviderId)) {
      throw new BadRequestException('El proveedor ya calificó esta orden.');
    }

    const photoUrl = files?.length
      ? await this.handlePhotoUploads(files)
      : dto.photoUrl || null;

    const review = this.reviewRepo.create({
      ...dto,
      photoUrl: photoUrl ?? undefined,
    });
    return await this.reviewRepo.save(review);
  }

  // Crear reseña para cliente
  // async createReviewClient(dto: CreateReviewDto) {
  //   // Validar combinación de autor y destinatario
  //   const validCombo =
  //     (dto.authorUserId && dto.targetProviderId) ||
  //     (dto.authorProviderId && dto.targetUserId);

  //   if (!validCombo) {
  //     throw new BadRequestException(
  //       'Debe especificar un autor y destinatario válidos (user->provider o provider->user)',
  //     );
  //   }

  //   const order = await this.orderRepo.findOne({ where: { id: dto.orderId } });
  //   if (!order) throw new NotFoundException('Orden no encontrada');

  //   //Validar si ya existe review
  //   const existingReviews = await this.reviewRepo.find({
  //     where: { orderId: dto.orderId },
  //   });

  //   if (dto.authorUserId && existingReviews.some((r) => !!r.authorUserId)) {
  //     throw new BadRequestException('El cliente ya calificó esta orden.');
  //   }

  //   if (
  //     dto.authorProviderId &&
  //     existingReviews.some((r) => !!r.authorProviderId)
  //   ) {
  //     throw new BadRequestException('El proveedor ya calificó esta orden.');
  //   }

  //   const review = this.reviewRepo.create(dto);
  //   return await this.reviewRepo.save(review);
  // }

  // Obtener reseñas para un proveedor
  async findByProvider(providerId: string) {
    return await this.reviewRepo.find({
      where: { targetProviderId: providerId },
      relations: ['authorUser', 'serviceOrders'],
      order: { createdAt: 'DESC' },
    });
  }
  // Obtener reseñas para un usuario
  async findByUser(userId: string) {
    return await this.reviewRepo.find({
      where: { targetUserId: userId },
      relations: ['authorProvider', 'serviceOrders'],
      order: { createdAt: 'DESC' },
    });
  }
  // Calificación promedio para un proveedor
  async getAverageRatingForProvider(providerId: string) {
    const reviews = await this.reviewRepo.find({
      where: { targetProviderId: providerId },
    });
    if (!reviews.length) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return Number((sum / reviews.length).toFixed(1));
  }
  // Calificación promedio para un usuario
  async getAverageRatingForUser(userId: string) {
    const reviews = await this.reviewRepo.find({
      where: { targetUserId: userId },
    });
    if (!reviews.length) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return Number((sum / reviews.length).toFixed(1));
  }

  async validateReviewStatus(orderId: string) {
    const reviews = await this.reviewRepo.find({ where: { orderId } });

    const clientReviewed = reviews.some((r) => !!r.authorUserId);
    const providerReviewed = reviews.some((r) => !!r.authorProviderId);

    return { clientReviewed, providerReviewed };
  }

  // Subir múltiples fotos
  private async handlePhotoUploads(
    files?: Express.Multer.File[],
  ): Promise<string[] | null> {
    if (!files || files.length === 0) return null;

    const uploads = await Promise.all(
      files.map((file) =>
        this.cloudinaryService.uploadImage(file, 'serviyapp/reviews'),
      ),
    );

    return uploads.map((r) => r.secure_url);
  }
}
