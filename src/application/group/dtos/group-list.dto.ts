import { Expose, Type, Transform } from 'class-transformer';
import { GroupChatType, GroupPrivacyType, GroupChatStatusType } from '../../../core/entities/group-chat.entity';
import { MessageType, MessageStatus } from '../../../core/entities/message.entity';
import { MemberStatusType } from '../../../core/entities/member.entity';
import { GenderType } from '../../../core/entities/user.entity';

export class UserDto {
  @Expose()
  userId: number;

  @Expose()
  email?: string | null;

  @Expose()
  phone: string;

  @Expose()
  password: string;

  @Expose()
  birthday?: Date;

  @Expose()
  gender: GenderType;

  @Expose()
  avatar?: string;

  @Expose()
  fullName: string;

  @Expose()
  bio: string;

  @Expose()
  userName: string;

  @Expose()
  country?: string;

  @Expose()
  googleAccountId?: string | null;

  @Expose()
  isActive: boolean;

  @Expose()
  createdAt: Date;
}

export class GroupRoleDto {
  @Expose()
  roleId: number;

  @Expose()
  name: string;

  @Expose()
  groupId: number;
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

  @Expose()
  @Type(() => UserDto)
  user?: UserDto;

  @Expose()
  @Type(() => GroupRoleDto)
  role?: GroupRoleDto;
}

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

  @Expose()
  @Type(() => MemberDto)
  ownerMember?: MemberDto;

  @Expose()
  @Type(() => MessageDto)
  replyMessage?: MessageDto;

  @Expose()
  @Type(() => MessageDto)
  inverseReplyMessage?: MessageDto[];

  // Legacy field for backward compatibility
  @Expose()
  @Transform(({ obj }) => obj.ownerMember)
  sender?: MemberDto;
}

export class GroupChatDto {
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

  @Expose()
  @Type(() => MemberDto)
  members?: MemberDto[];

  @Expose()
  @Type(() => GroupRoleDto)
  roles?: GroupRoleDto[];
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

  // Additional UI fields
  @Expose()
  memberCount: number;
}
