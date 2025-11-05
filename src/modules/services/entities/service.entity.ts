import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Provider } from 'src/modules/providers/entities/provider.entity';
import { Category } from 'src/modules/categories/entities/category.entity';
import { ServiceStatus } from '../enums/service-status.enum';
import { ServiceOrder } from 'src/modules/service-orders/entities/service-order.entity';
import { on } from 'events';

// Entidad que representa los servicios ofrecidos por los proveedores.
// Incluye información básica, relación con el proveedor y su categoría.
@Entity({ name: 'services' })
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ nullable: true })
  photo: string;

  @Column({ type: 'enum', enum: ServiceStatus, default: ServiceStatus.ACTIVE })
  status: ServiceStatus;

  @Column({ type: 'int' })
  price: number;

  @Column({ type: 'int', nullable: true })
  duration: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => Provider, (provider) => provider.services)
  @JoinColumn({ name: 'providerId' })
  provider: Provider;

  @ManyToOne(() => Category, (category) => category.services)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @OneToMany(() => ServiceOrder, (serviceOrder) => serviceOrder.service)
  serviceOrders: ServiceOrder[];
}
