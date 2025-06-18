import { Message, MessageType } from "../../../core/entities/message.entity";
import { Member, MemberStatusType } from "../../../core/entities/member.entity";
import { BaseRepository } from "./base.repository";
import { PollOption } from "../../../core/entities/poll-option.entity";
import { Reaction } from "../../../core/entities/reaction.entity";
import { tr } from "@faker-js/faker/.";

export default class MessageRepository extends BaseRepository<Message> {
  constructor() {
    super(Message);
  }

  async reactMessage(messageId: number, memberId: number, emoji: string) {
    const existingReaction = await this.manager
      .getRepository(Reaction)
      .findOne({
        where: { messageId: messageId, memberId: memberId },
      });

    const member = await this.manager
      .getRepository(Member)
      .findOne({ where: { memberId: memberId } });

    if (!member) {
      return false;
    }

    if (existingReaction) {
      console.log(existingReaction);
      await this.manager.getRepository(Reaction).update(
        {
          messageId: messageId,
          memberId: memberId,
        },
        {
          emojiData: emoji,
        }
      );
    } else {
      const newReaction = this.manager.getRepository(Reaction).create({
        messageId: messageId,
        emojiData: emoji,
        memberId: memberId,
      });
      await this.manager.getRepository(Reaction).save(newReaction);
    }
    return true;
  }

  async votePollMessage(memberId: number, messageId: number, optionId: number) {
    const message = await this.findOne({
      where: { messageId: messageId },
    });
    if (!message || message.type !== MessageType.Poll) {
      throw new Error("Message not found or is not a poll message");
    }
    const member = await this.manager
      .getRepository(Member)
      .findOne({ where: { memberId: memberId } });

    let option = await this.manager
      .getRepository(PollOption)
      .findOne({ where: { optionId: optionId } });

    option?.votedBy.push(member!);

    await this.manager.getRepository(PollOption).save(option!);

    return message;
  }

  async sendPollMessage(
    memberId: number,
    content: string,
    expiredAt: Date | undefined,
    isMultipleChoice: boolean,
    options: string[]
  ) {
    return this.manager.transaction(async (transactionalEntityManager) => {
      const message = this.create({
        content: content,
        type: MessageType.Poll,
        memberId: memberId,
        poll: {
          options: options.map((option) => ({
            text: option,
          })),
          isMultipleChoice: isMultipleChoice,
          expiredAt: expiredAt,
        },
      });
      const savedMessage = await transactionalEntityManager.save(message);
      // Return the saved message with full relations
      return await transactionalEntityManager.findOne(Message, {
        where: { messageId: savedMessage.messageId },
      });
    });
  }

  async hasVotedPollMessage(memberId: number, messageId: number) {
    const message = await this.manager
      .createQueryBuilder(Message, "message")
      .leftJoinAndSelect("message.poll", "poll")
      .leftJoinAndSelect("poll.options", "options")
      .leftJoinAndSelect("options.votedBy", "votedMembers")
      .where("message.messageId = :messageId", { messageId })
      .andWhere("votedMembers.memberId = :memberId", { memberId })
      .getOne();

    return !!message?.poll?.options.some((option) =>
      option.votedBy.some((voter) => voter.memberId === memberId)
    );
  }

  async sendFileMessage(
    memberId: number,
    callback: () => Promise<{ key: string; mimeType: string }[]>,
    content: string,
    manipulates: number[],
    replyMessageId: number | null | undefined
  ) {
    return await this.manager.transaction(
      async (transactionalEntityManager) => {
        let listNewMessage: Message[] = [];
        const listKeyFiles = await callback();
        if (content) {
          const message = this.create({
            content: content,
            type: MessageType.Text,
            memberId: memberId,
            replyMessageId: replyMessageId || undefined,
            manipulateMembers: [
              ...(manipulates || []).map((manipulateId) => ({
                memberId: manipulateId,
              })),
            ],
          });
          listNewMessage.push(await transactionalEntityManager.save(message));
        }
        console.log("listKeyFiles", listKeyFiles);
        const message = this.create({
          content: content,
          type: MessageType.File,
          memberId: memberId,
          files: listKeyFiles.map((file) => ({
            fileId: file.key,
            mimeType: file.mimeType,
          })),
        });
        const savedMessage = await transactionalEntityManager.save(message);
        listNewMessage.push(savedMessage);
        return listNewMessage;
      }
    );
  }

  async sendNotificationMessage(
    memberId: number,
    content: string,
    manipulates: number[]
  ) {
    return await this.manager.transaction(
      async (transactionalEntityManager) => {
        try {
          const message = this.create({
            content: content,
            type: MessageType.Notification,
            memberId: memberId,
            manipulateMembers: [
              ...(manipulates || []).map((manipulateId) => ({
                memberId: manipulateId,
              })),
            ],
          });
          const savedMessage = await transactionalEntityManager.save(message);
          return await transactionalEntityManager.findOne(Message, {
            where: { messageId: savedMessage.messageId },
          });
        } catch (error) {
          console.error("Error saving message:", error);
          return null;
        }
      }
    );
  }

  async sendTextMessage(
    memberId: number,
    content: string,
    messageType: MessageType,
    manipulates: number[],
    replyMessageId: number | null = null
  ) {
    return this.manager.transaction(async (transactionalEntityManager) => {
      const message = this.create({
        content: content,
        createdAt: new Date(),
        type: messageType,
        memberId: memberId,
        replyMessageId: replyMessageId || undefined,
        manipulateMembers: [
          ...(manipulates || []).map((manipulateId) => ({
            memberId: manipulateId,
          })),
        ],
      });
      const savedMessage = await transactionalEntityManager.save(message);
      // Return the saved message
      return await transactionalEntityManager.findOne(Message, {
        where: { messageId: savedMessage.messageId },
        relations: ["replyMessage"],
      });
    });
  }

  async sendGifMessage(
    memberId: number,
    content: string,
    replyMessageId: number | null
  ) {
    return this.manager.transaction(async (transactionalEntityManager) => {
      try {
        const message = this.create({
          content: content,
          createdAt: new Date(),
          type: MessageType.Gif,
          memberId: memberId,
          replyMessageId: replyMessageId || undefined,
        });
        const savedMessage = await transactionalEntityManager.save(message);
        return savedMessage;
      } catch (error) {
        console.error("Error saving GIF message:", error);
        return null;
      }
    });
  }

  /**
   * Get list of messages from a group with cursor-based pagination
   * @param groupId - The ID of the group
   * @param cursor - The messageId to start from (exclusive, gets messages older than this)
   * @param limit - Maximum number of messages to return
   * @returns Promise<Message[]> - Array of messages with full relations
   */
  async getListMessageFromGroup(
    groupId: number,
    cursor?: number,
    limit: number = 20
  ): Promise<Message[]> {
    let queryBuilder = this.manager
      .createQueryBuilder(Message, "message")
      .leftJoinAndSelect("message.ownerMember", "ownerMember")
      .leftJoinAndSelect("ownerMember.user", "ownerUser")
      .leftJoinAndSelect("ownerMember.role", "ownerRole")
      .leftJoinAndSelect("message.replyMessage", "replyMessage")
      .leftJoinAndSelect("replyMessage.ownerMember", "replyOwnerMember")
      .leftJoinAndSelect("replyOwnerMember.user", "replyOwnerUser")
      .leftJoinAndSelect("message.manipulateMembers", "member")
      .leftJoinAndSelect("member.user", "manipulateUser")
      .leftJoinAndSelect("message.reactions", "reactions")
      .leftJoinAndSelect("reactions.member", "reactionMember")
      .leftJoinAndSelect("reactionMember.user", "reactionUser")
      .leftJoinAndSelect("message.poll", "poll")
      .leftJoinAndSelect("poll.options", "pollOptions")
      .leftJoinAndSelect("pollOptions.votedBy", "votedMembers")
      .leftJoinAndSelect("votedMembers.user", "user")
      .leftJoinAndSelect("message.files", "files")
      .where(
        "message.memberId IN (SELECT m.memberId FROM Member m WHERE m.groupId = :groupId AND m.status = :status)",
        {
          groupId,
          status: MemberStatusType.Active,
        }
      );

    // Apply cursor-based pagination if cursor is provided
    if (cursor) {
      queryBuilder = queryBuilder.andWhere("message.messageId < :cursor", {
        cursor,
      });
    }

    // Order by messageId descending (newest first) and apply limit
    const messages = await queryBuilder
      .orderBy("message.messageId", "DESC")
      .limit(limit)
      .getMany();

    return messages;
  }

  /**
   * Get latest message from a group
   * @param groupId - The ID of the group
   * @returns Promise<Message | null> - The latest message or null if no messages
   */
  async getLatestMessageFromGroup(groupId: number): Promise<Message | null> {
    const latestMessage = await this.manager
      .createQueryBuilder(Message, "message")
      .leftJoinAndSelect("message.ownerMember", "ownerMember")
      .leftJoinAndSelect("ownerMember.user", "ownerUser")
      .leftJoinAndSelect("ownerMember.role", "ownerRole")
      .leftJoinAndSelect("message.replyMessage", "replyMessage")
      .leftJoinAndSelect("replyMessage.ownerMember", "replyOwnerMember")
      .leftJoinAndSelect("replyOwnerMember.user", "replyOwnerUser")
      .leftJoinAndSelect("message.reactions", "reactions")
      .leftJoinAndSelect("message.manipulateMembers", "member")
      .leftJoinAndSelect("member.user", "user")
      .leftJoinAndSelect("reactions.member", "reactionMember")
      .leftJoinAndSelect("reactionMember.user", "reactionUser")
      .leftJoinAndSelect("message.poll", "poll")
      .leftJoinAndSelect("poll.options", "pollOptions")
      .leftJoinAndSelect("pollOptions.votedBy", "votedMembers")
      .leftJoinAndSelect("votedMembers.user", "informationUser")
      .leftJoinAndSelect("message.files", "files")
      .where(
        "message.memberId IN (SELECT m.memberId FROM Member m WHERE m.groupId = :groupId AND m.status = :status)",
        {
          groupId,
          status: MemberStatusType.Active,
        }
      )
      .orderBy("message.messageId", "DESC")
      .take(1)
      .getOne();
    return latestMessage;
  }

  /**
   * Get messages after a specific messageId (for real-time updates)
   * @param groupId - The ID of the group
   * @param afterMessageId - Get messages newer than this messageId
   * @param limit - Maximum number of messages to return
   * @returns Promise<Message[]> - Array of new messages
   */
  async getNewMessagesFromGroup(
    groupId: number,
    afterMessageId: number,
    limit: number = 50
  ): Promise<Message[]> {
    const newMessages = await this.manager
      .createQueryBuilder(Message, "message")
      .leftJoinAndSelect("message.ownerMember", "ownerMember")
      .leftJoinAndSelect("ownerMember.user", "ownerUser")
      .leftJoinAndSelect("ownerMember.role", "ownerRole")
      .leftJoinAndSelect("message.replyMessage", "replyMessage")
      .leftJoinAndSelect("replyMessage.ownerMember", "replyOwnerMember")
      .leftJoinAndSelect("replyOwnerMember.user", "replyOwnerUser")
      .leftJoinAndSelect("message.manipulateMembers", "manipulateMembers")
      .leftJoinAndSelect("manipulateMembers.member", "manipulateMember")
      .leftJoinAndSelect("manipulateMember.user", "manipulateUser")
      .leftJoinAndSelect("message.reactions", "reactions")
      .leftJoinAndSelect("reactions.member", "reactionMember")
      .leftJoinAndSelect("reactionMember.user", "reactionUser")
      .where(
        "message.memberId IN (SELECT m.memberId FROM Member m WHERE m.groupId = :groupId AND m.status = :status)",
        {
          groupId,
          status: MemberStatusType.Active,
        }
      )
      .andWhere("message.messageId > :afterMessageId", { afterMessageId })
      .orderBy("message.messageId", "ASC") // Ascending for new messages
      .limit(limit)
      .getMany();

    return newMessages;
  }
}
