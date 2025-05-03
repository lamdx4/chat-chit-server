// relationship.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';
import { User } from './user.entity';

export enum RelationType {
  NoRelationship = 'NoRelationship',
  Friend = 'Friend',
  Block = 'Block'
}

@Entity({ name: 'Relationship' })
@Index('IdUser1', ['requesterId'])
@Index('IdUser2', ['addresseeId'])
export class Relationship {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  requesterId?: number;

  @Column({ nullable: true })
  addresseeId?: number;

  @Column({ type: 'enum', enum: RelationType })
  relationType: RelationType;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createAt: Date;

  @ManyToOne(() => User, user => user.relationshipRequesters)
  requester?: User;

  @ManyToOne(() => User, user => user.relationshipAddressees)
  addressee?: User;
}