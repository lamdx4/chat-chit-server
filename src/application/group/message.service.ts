import MessageRepository from "../../infras/data/repository/message.repository";

export default class MessageService {
  private messageRepository: MessageRepository;
  constructor() {
    this.messageRepository = new MessageRepository(); // Initialize the repository
  }
  async getAllFileFromGroup(groupId: number, cursor: number, limit: number) {}
  async getListPinMessage(userId: number, groupId: number) {}
  async sendGifMessage(
    groupId: number,
    userId: number,
    content: string,
    replyMessageId: number | null
  ) {}

  async forwardMessage(
    userId: number,
    groupId: number,
    messageId: number,
    groupIdAddressee: number
  ) {}
  async isMessageContainInGroup(messageId: Number, groupId: Number) {}
  async changeStatusMessage(
    messageId: number
    // status: MessageStatus
  ) {
    // return await this.messageRepository.changeStatusMessage(messageId, status);
  }
  async isMessageOfUser(messageId: Number, userId: Number) {}
  async getOneMessage(messageId: number) {}
  async getAllManipulateUser(messageId: number) {
    // return await this.messageRepository.getAllManipulateUser(messageId);
  }
  async getAllReactFromMessage(messageId: number) {}
  async getNumMessageUnread(groupId: number, userId: number) {}
  async getLastMessage(groupId: number) {}

  async sendNotifyMessage(
    groupId: number,
    userId: number,
    content: string,
    manipulates: Array<number>
  ) {
    let regex2 = /\{\{@\}\}/g;
    let matches = content.match(regex2);
    let count = matches ? matches.length : 0; // Số lần xuất hiện của chuỗi `{{@}}`
    if (count != manipulates.length) {
    }
    return this.messageRepository.sendNotificationMessage(
      groupId,
      userId,
      content,
      manipulates
    );
  }
  
  async reCallMessage(userId: number, groupId: number, messageId: number) {}
  async changePinMessage(
    groupId: number,
    messageId: number,
    userId: number,
    isPin: boolean
  ) {}
  async reactMessage(
    messageId: number,
    // react: ReactMessage,
    userId: number,
    groupId: number
  ) {}
  async sendTextMessage(
    groupId: number,
    userId: number,
    content: string,
    manipulates: Array<number>,
    replyMessageId: number
  ) {}
  async getAllMessageFromGroup(
    groupId: number,
    userId: number,
    cursor: number,
    limit: number
  ) {}
}
