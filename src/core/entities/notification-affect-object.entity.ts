// notification-affect-object.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Notification } from './notification.entity';

@Entity({ name: 'NotificationAffectObject' })
export class NotificationAffectObject {
  @PrimaryGeneratedColumn({ name: 'affectObjectId' })
  affectObjectId: number;

  @Column({ 
    name: 'entity',
    length: 50 
  })
  entity: string;

  @Column({ name: 'entityId' })
  entityId: number;

  @Column({ name: 'notificationId' })
  notificationId: number;

  // Quan hệ bị thiếu
  @ManyToOne(() => Notification, notification => notification.notificationAffectObjects)
  @JoinColumn({ name: 'notificationId' })
  notification: Notification;

  @OneToMany(() => Notification, notification => notification.affectObject)
  notifications: Notification[];
}