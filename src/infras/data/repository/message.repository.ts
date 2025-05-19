import { Message, MessageType } from "../../../core/entities/message.entity";
import { BaseRepository } from "./base.repository";

export default class MessageRepository extends BaseRepository<Message> {
  constructor() {
    super(Message);
  }
  sendNotificationMessage(
    groupId: number,
    userId: number,
    content: string,
    manipulates: number[]
  ) {
    return this.manager.transaction(async (transactionalEntityManager) => {
      try {
        const message = this.create({
          content: content,
          createdAt: new Date(),
          type: MessageType.Notification,
          memberId : userId,
        });
        const savedMessage = await transactionalEntityManager.save(message);
        return savedMessage;
      } catch (error) {
        console.error("Error saving message:", error);
        return null;
      }
    });
  }
}
