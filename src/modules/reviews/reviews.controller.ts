import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('createReviewProvider')
  createReviewProvider(@Body() dto: CreateReviewDto) {
    return this.reviewsService.createReviewProvider(dto);
  }

  @Post('createReviewClient')
  createReviewClient(@Body() dto: CreateReviewDto) {
    return this.reviewsService.createReviewClient(dto);
  }

  // Reseñas hacia un proveedor
  @Get('/provider/:id')
  findByProvider(@Param('id') id: string) {
    return this.reviewsService.findByProvider(id);
  }

  // Reseñas hacia un usuario
  @Get('/user/:id')
  findByUser(@Param('id') id: string) {
    return this.reviewsService.findByUser(id);
  }

  // Promedio de calificación de un proveedor
  @Get('/provider/:id/average')
  getAverageProvider(@Param('id') id: string) {
    return this.reviewsService.getAverageRatingForProvider(id);
  }

  // Promedio de calificación de un usuario
  @Get('/user/:id/average')
  getAverageUser(@Param('id') id: string) {
    return this.reviewsService.getAverageRatingForUser(id);
  }

  @Get('/order/:orderId/validate')
  validateReview(@Param('orderId') orderId: string) {
    return this.reviewsService.validateReviewStatus(orderId);
  }
}
