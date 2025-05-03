// notification-subject.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Notification } from "./notification.entity";

@Entity("NotificationSubject")
export class NotificationSubject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  notificationId: number;

  @Column()
  entity: string;

  @Column()
  entityId: number;

  @Column("datetime")
  createAt: Date;

  @ManyToOne(
    () => Notification,
    (notification) => notification.notificationSubjects
  )
  notification: Notification;
}
