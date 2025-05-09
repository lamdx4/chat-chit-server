import { Expose, Type } from "class-transformer";
import { RelationType } from "../../../core/entities/relationship.entity";
import { UserDto } from "./user-profile.dto";

export class UserRelationshipDto {
  @Expose()
  relationshipId: number;

  @Expose()
  targetUserId: number | undefined;

  @Type(() => UserDto)
  @Expose()
  targetUser: UserDto | null;

  @Expose()
  relationType: RelationType;

  @Expose()
  direction: string;

  @Expose()
  createdAt: Date;
}
