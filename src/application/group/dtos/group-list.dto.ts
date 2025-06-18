import { Expose, Type, Transform } from "class-transformer";
import {
  GroupChatType,
  GroupPrivacyType,
  GroupChatStatusType,
} from "../../../core/entities/group-chat.entity";
import {
  MessageType,
  MessageStatus,
} from "../../../core/entities/message.entity";
import { MemberStatusType } from "../../../core/entities/member.entity";
import { GenderType } from "../../../core/entities/user.entity";
import { TransformUtil } from "../../utils/transform.util";
import {
  TransformUrl,
  TransformUrlFrom,
} from "../../../shared-kernel/decorators/transform.decorators";
import { Reaction } from "../../../core/entities/reaction.entity";
import { E, T } from "@faker-js/faker/dist/airline-BUL6NtOJ";

export class UserDto {
  @Expose()
  userId: number;

  @Expose()
  gender: GenderType;

  @TransformUrl()
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
}

export class GroupRoleDto {
  @Expose()
  roleId: number;

  @Expose()
  name: string;

  @Expose()
  permission: PermissionDto[];
}

export class PermissionDto {
  @Expose()
  permissionId: number;

  @Expose()
  name: string;

  @Expose()
  description: string;
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

export class PollDto {
  @Expose()
  pollId: number;

  @Expose()
  isMultipleChoice: boolean;

  @Expose()
  isClosed: boolean;

  @Expose()
  expiredAt?: Date;

  @Expose()
  @Type(() => PollOptionDto)
  options: PollOptionDto[];
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
  @Type(() => MemberDto)
  ownerMember?: MemberDto;

  @Expose()
  @Type(() => MessageDto)
  replyMessage?: MessageDto;

  @Expose()
  @Type(() => MessageDto)
  inverseReplyMessage?: MessageDto[];

  @Expose()
  @Type(() => MemberDto)
  manipulateMembers: MemberDto[];

  @Expose()
  @Type(() => FileDto)
  files: FileDto[];

  @Type(() => ReactionDto)
  @Expose()
  reactions: ReactionDto[];

  @Expose()
  @Type(() => PollDto)
  poll?: PollDto;
}

export class ReactionDto {
  @Expose()
  reactionId: number;

  @Expose()
  emojiData: string;

  @Expose()
  @Type(() => MemberDto)
  member: MemberDto;
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

  @TransformUrl()
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

export class GroupItemDto {
  @Expose()
  groupId: number;

  @Expose()
  name: string;

  @Expose()
  createAt: Date;

  @Expose()
  groupChatStatus: GroupChatStatusType;

  @TransformUrl()
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
  @Type(() => MessageDto)
  messages: MessageDto[];

  @Expose()
  @Type(() => MemberDto)
  currentMember: MemberDto;

  @Expose()
  @Type(() => MemberDto)
  members: MemberDto[];

  @Expose()
  @Transform(({ value }) => parseInt(value) || 0)
  unreadCount: number;

  // For cursor pagination - latest message ID in this group
  @Expose()
  latestMessageId?: number;

  // Additional UI fields
  @Expose()
  memberCount: number;

  @Expose()
  emoji: string;
}

export class FileDto {
  @Expose()
  fileId: string;

  @Expose()
  mimeType: string;

  @TransformUrlFrom("fileId")
  @Expose()
  url: string;
}

export class PollOptionDto {
  @Expose()
  optionId: number;

  @Expose()
  text: string;

  @Expose()
  votedAt: Date;

  @Expose()
  @Type(() => MemberDto)
  votedBy: MemberDto[];
}
