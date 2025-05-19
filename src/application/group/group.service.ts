import { Brackets } from "typeorm";
import GroupRepository from "../../infras/data/repository/group.repository";
import UserRepository from "../../infras/data/repository/user.repository";
import CreateGroupRequest from "../../web/controllers/group/reqs/create-group.request";
import { Result } from "../../web/utils/result";
import RelationshipRepository from "../../infras/data/repository/relationship.repository";
import { RelationType } from "../../core/entities/relationship.entity";
import { GroupChat } from "../../core/entities/group-chat.entity";

export default class GroupService {
  private groupRepository: GroupRepository;
  private relationshipRepository: RelationshipRepository;
  private userRepository: UserRepository;
  constructor() {
    this.groupRepository = new GroupRepository(); // Initialize the repository
    this.userRepository = new UserRepository(); // Initialize the user repository
    this.relationshipRepository = new RelationshipRepository(); // Initialize the relationship repository
  }

  // Define methods for group-related operations here
  // For example:
  async createGroup(userId: number, groupData: CreateGroupRequest) {
    const relationships = await this.relationshipRepository
      .createQueryBuilder("relationship")
      .where("relationship.relationType = :friendType", {
        friendType: RelationType.Friend,
      })
      .andWhere(
        new Brackets((qb) => {
          qb.where(
            "relationship.requesterId = :userId AND relationship.addresseeId IN (:...friendIds)",
            { userId: userId, friendIds: groupData.members }
          ).orWhere(
            "relationship.addresseeId = :userId AND relationship.requesterId IN (:...friendIds)",
            { userId: userId, friendIds: groupData.members }
          );
        })
      )
      .getMany();

    // Check if all members exist in the database
    if (relationships.length !== groupData.members.length) {
      return Result.fail(400, "NOT_ALL_MEMBERS_ARE_FRIENDS");
    }
    let g: GroupChat | null = null;
    try {
      g = await this.groupRepository.createGroup(userId, groupData);
    } catch (e) {
      console.log(e);
      return Result.fail(500, "CREATE_GROUP_FAILED");
    }

    return Result.ok();
  }

  async getGroupById(groupId: number): Promise<any> {
    // Logic to retrieve a group by its ID
  }

  async updateGroup(groupId: number, groupData: any): Promise<any> {
    // Logic to update a group's information
  }

  async deleteGroup(groupId: number): Promise<any> {
    // Logic to delete a group
  }
}
