import { Expose, Type, Transform } from 'class-transformer';
import { GroupChatType, GroupPrivacyType, GroupChatStatusType } from '../../../core/entities/group-chat.entity';
import { MessageType, MessageStatus } from '../../../core/entities/message.entity';
import { MemberStatusType } from '../../../core/entities/member.entity';

export class MessageDto {
  @Expose()
  messageId: number;

  @Expose()
  content: string;

  @Expose()
  createdAt: Date;

  @Expose()
  type: MessageType;

  @Expose()
  status: MessageStatus;

  @Expose()
  replyMessageId?: number;

  @Expose()
  isPin: boolean;

  @Expose()
  memberId: number;

  @Expose()
  fileId?: number;
}

export class MemberDto {
  @Expose()
  memberId: number;

  @Expose()
  groupId: number;

  @Expose()
  userId: number;

  @Expose()
  lastReadMessageId?: number;

  @Expose()
  lastReceivedMessageId?: number;

  @Expose()
  roleId: number;

  @Expose()
  status: MemberStatusType;

  @Expose()
  timeJoin: Date;

  @Expose()
  nickName: string;
}

export class GroupListItemDto {
  @Expose()
  groupId: number;

  @Expose()
  name: string;

  @Expose()
  createAt: Date;

  @Expose()
  groupChatStatus: GroupChatStatusType;

  @Expose()
  avatar?: string;

  @Expose()
  groupType: GroupChatType;

  @Expose()
  groupPrivacyType: GroupPrivacyType;

  @Expose()
  link: string;

  // Derived fields for UI convenience
  @Expose()
  @Type(() => MessageDto)
  latestMessage?: MessageDto;

  @Expose()
  @Type(() => MemberDto) 
  currentMember: MemberDto;

  @Expose()
  @Transform(({ value }) => parseInt(value) || 0)
  unreadCount: number;

  // For cursor pagination - latest message ID in this group
  @Expose()
  latestMessageId?: number;
}
