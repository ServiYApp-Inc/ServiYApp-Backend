import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { Provider } from 'src/modules/providers/entities/provider.entity';

@Entity({ name: 'service_orders' })
export class ServiceOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ default: 'pending' })
  status: string; // pending | accepted | completed | cancelled

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.orders, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Provider, (provider) => provider.orders, {
    onDelete: 'CASCADE',
  })
  provider: Provider;
}
