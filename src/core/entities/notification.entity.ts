// notification.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { NotificationAffectObject } from './notification-affect-object.entity';
import { NotificationSubject } from './notification-subject.entity';

@Entity("Notification")
export class Notification {
  @PrimaryGeneratedColumn()
  notificationId: number;

  @Column()
  ownerId: number;

  @Column()
  contextType: string;

  @Column('datetime')
  createdAt: Date;

  @Column()
  subjectsCount: number;

  @Column()
  affectObjectId: number;

  @Column()
  notificationType: string;

  @Column('datetime')
  updateAt: Date;

  @ManyToOne(() => NotificationAffectObject)
  @JoinColumn({ name: 'affectObjectId' })
  affectObject: NotificationAffectObject;

  @OneToMany(() => NotificationAffectObject, nao => nao.notification)
  notificationAffectObjects: NotificationAffectObject[];

  @OneToMany(() => NotificationSubject, ns => ns.notification)
  notificationSubjects: NotificationSubject[];

  @ManyToOne(() => User, user => user.notifications)
  @JoinColumn({ name: 'ownerId' })
  owner: User;
}   