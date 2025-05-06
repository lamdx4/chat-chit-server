import { GroupChat } from "../../../core/entities/group-chat.entity";
import { BaseRepository } from "./base.repository";

export default class GroupRepository extends BaseRepository<GroupChat> {
  constructor() {
    super(GroupChat);
  }
}
