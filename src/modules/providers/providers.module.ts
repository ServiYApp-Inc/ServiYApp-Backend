import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProvidersController } from './providers.controller';
import { ProvidersService } from './providers.service';
import { Provider } from './entities/provider.entity';
import { ProviderDocument } from './entities/provider-document.entity';
import { Schedule } from './entities/schedule.entity';
import { ProvidersSeed } from './seeds/providers.seed';
import { LocationsModule } from '../locations/locations.module';

// Módulo encargado de la gestión de proveedores.
// Incluye controladores, servicios, entidades y precarga inicial de datos (seed).
@Module({
  imports: [
    TypeOrmModule.forFeature([Provider, ProviderDocument, Schedule]),
    LocationsModule,
  ],
  controllers: [ProvidersController],
  providers: [ProvidersService, ProvidersSeed],
  exports: [ProvidersService, TypeOrmModule, ProvidersSeed],
})
export class ProvidersModule {}
