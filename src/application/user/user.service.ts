import Stream from "stream";
import { CloudService } from "../../infras/aws-s3/aws-s3.service";
import FileRepository from "../../infras/data/repository/file.repository";
import UserRepository from "../../infras/data/repository/user.repository";
import { GoogleOAuthHelper } from "../../infras/google-auth/google-oauth-helper";
import { ConfigService } from "../../shared-kernel/env/config-service";
import { ChangeMyBaseProfileRequest } from "../../web/controllers/user/req/change-base-profile.req";
import { Result } from "../../web/utils/result";
import RelationshipRepository from "../../infras/data/repository/relationship.repository";
import {
  Relationship,
  RelationType,
} from "../../core/entities/relationship.entity";
import { UserRelationshipDto } from "./dtos/user-relationship";
import { mapArrayToDto, mapToDto } from "../utils/mapper";
import { LessThan } from "typeorm";

export default class UserService {
  private ggHelper: GoogleOAuthHelper;
  private userRepository: UserRepository;
  private fileRepository: FileRepository;
  private cloudService: CloudService;
  private relationshipRepository: RelationshipRepository;

  constructor() {
    this.fileRepository = new FileRepository();
    this.cloudService = CloudService.getInstance();
    this.ggHelper = new GoogleOAuthHelper({
      ClientId: ConfigService.tryGet("GOOGLE_CLIENT_ID"),
      ClientSecret: ConfigService.tryGet("GOOGLE_CLIENT_SECRET"),
      RedirectUri: ConfigService.tryGet("GOOGLE_REDIRECT_URI"),
    });
    this.userRepository = new UserRepository();
    this.relationshipRepository = new RelationshipRepository();
  }

  async getFriendRequestList(userId: number, cursor: number, limit: number) {
    const user = await this.userRepository.findOneBy({
      userId: userId,
    });
    if (!user) {
      return Result.notFound("USER_NOT_FOUND");
    }
    const friendReqList = await this.relationshipRepository.find({
      where: [
        {
          addresseeId: userId,
          relationType: RelationType.Pending,
          relationshipId: LessThan(cursor),
        },
      ],
      order: {
        relationshipId: "DESC",
      },
      take: limit,
    });
    return Result.Ok(await this.normalizeRelationships(userId, friendReqList));
  }

  async getFriendRequestSentList(
    userId: number,
    cursor: number,
    limit: number
  ) {
    const user = await this.userRepository.findOneBy({
      userId: userId,
    });
    if (!user) {
      return Result.notFound("USER_NOT_FOUND");
    }
    const friendList = await this.relationshipRepository.find({
      where: [
        {
          requesterId: userId,
          relationType: RelationType.Pending,
          relationshipId: LessThan(cursor),
        },
      ],
      order: {
        relationshipId: "DESC",
      },
      take: limit,
    });
    return Result.Ok(await this.normalizeRelationships(userId, friendList));
  }

  async getBlockList(userId: number, cursor: number, limit: number) {
    const user = await this.userRepository.findOneBy({
      userId: userId,
    });
    if (!user) {
      return Result.notFound("USER_NOT_FOUND");
    }
    const friendList = await this.relationshipRepository.find({
      where: [
        {
          requesterId: userId,
          relationType: RelationType.Block,
          relationshipId: LessThan(cursor),
        },
      ],
      order: {
        relationshipId: "DESC",
      },
      take: limit,
    });
    return Result.Ok(await this.normalizeRelationships(userId, friendList));
  }

  async getFriendList(userId: number, cursor: number, limit: number) {
    const user = await this.userRepository.findOneBy({
      userId: userId,
    });
    if (!user) {
      return Result.notFound("USER_NOT_FOUND");
    }
    const friendList = await this.relationshipRepository.find({
      where: [
        {
          requesterId: userId,
          relationType: RelationType.Friend,
          relationshipId: LessThan(cursor),
        },
        {
          addresseeId: userId,
          relationType: RelationType.Friend,
          relationshipId: LessThan(cursor),
        },
      ],
      order: {
        relationshipId: "DESC",
      },
      take: limit,
    });
    return Result.Ok(await this.normalizeRelationships(userId, friendList));
  }

  async normalizeRelationships(
    userId: number,
    rawRelations: Relationship[]
  ): Promise<UserRelationshipDto[]> {
    const relations = await Promise.all(
      rawRelations.map(async (rel) => {
        const isOutgoing = rel.requesterId === userId;
        const targetUserId = isOutgoing ? rel.addresseeId : rel.requesterId;
        const targetUser = await this.userRepository.findOneBy({
          userId: targetUserId,
        });
        let mutualFriends: number = 0;
        if (targetUser) {
          if (targetUser.avatar) {
            targetUser.avatar = this.cloudService.getStaticUrl(
              targetUser.avatar
            );
          }
          // Đếm số bạn chung giữa userId và targetUserId bằng truy vấn SQL
          const rawResult = await this.relationshipRepository
            .createQueryBuilder("r1")
            .select("COUNT(*)", "mutualCount")
            .innerJoin(
              "Relationship",
              "r2",
              `(
              r2.relationType = :friendType AND ((r2.requesterId = :targetUserId AND r2.addresseeId = r1.requesterId) OR 
              (r2.addresseeId = :targetUserId AND r2.requesterId = r1.requesterId)
              )
              )`,
              {
                friendType: RelationType.Friend,
                targetUserId,
              }
            )
            .where(
              "r1.relationType = :friendType AND ((r1.requesterId = :userId) OR (r1.addresseeId = :userId))",
              { friendType: RelationType.Friend, userId }
            )
            .getRawOne();
          mutualFriends = Number(rawResult?.mutualCount || 0);
        }

        return {
          relationshipId: rel.relationshipId,
          targetUserId,
          mutualFriends,
          targetUser,
          relationType: rel.relationType,
          direction: isOutgoing ? "Outgoing" : "Incoming",
          createdAt: rel.createdAt,
        };
      })
    );
    return mapArrayToDto(UserRelationshipDto, relations);
  }

  async unlinkGoogleAccount(userId: number) {
    const user = await this.userRepository.findOneBy({
      userId: userId,
    });
    if (!user) {
      return Result.notFound("USER_NOT_FOUND");
    }
    if (!user.googleAccountId) {
      return Result.notFound("GOOGLE_ACCOUNT_NOT_LINKED");
    }
    const updatedUser = await this.userRepository.update(userId, {
      googleAccountId: null,
      email: null,
    });
    if (updatedUser.affected === 0) {
      return Result.notFound("USER_NOT_FOUND");
    }
    return Result.Ok({});
  }

  async linkGoogleToAccount(userId: number, code: string) {
    const user = await this.userRepository.findOneBy({
      userId: userId,
    });
    if (!user) {
      return Result.notFound("USER_NOT_FOUND");
    }
    let token;
    try {
      token = await this.ggHelper.getUserInfoFromCodeAsync(code);
    } catch (error) {
      console.error("Error while getting user info from Google:", error);
      return Result.badRequest("INVALID_CODE");
    }
    console.log(token);
    user.googleAccountId = token.account_id;
    user.email = token.email;

    const updatedUser = await this.userRepository.update(userId, user);
    if (updatedUser.affected === 0) {
      return Result.notFound("USER_NOT_FOUND");
    }

    return Result.Ok({});
  }

  async getLinkUrlLogin(userId: number) {
    return Result.Ok({
      url: this.ggHelper.getRedirectUri(userId),
    });
  }

  async changeUserName(userId: number, userName: string) {
    const existingUser = await this.userRepository.findOneBy({
      userName: userName,
    });
    if (existingUser) {
      return Result.conflict("USER_NAME_ALREADY_EXISTS");
    }

    const user = await this.userRepository.findOneBy({
      userId: userId,
    });
    if (!user) {
      return Result.notFound("USER_NOT_FOUND");
    }

    if (user.userName === userName) {
      return Result.conflict("USER_NAME_NOT_CHANGED");
    }

    user.userName = userName;

    const updatedUser = await this.userRepository.update(userId, user);
    if (updatedUser.affected === 0) {
      return Result.notFound("USER_NOT_FOUND");
    }

    return Result.Ok(updatedUser);
  }

  async changeAvatar(userId: number, file: Express.Multer.File) {
    const user = await this.userRepository.findOneBy({
      userId: userId,
    });
    if (!user) {
      return Result.notFound("USER_NOT_FOUND");
    }
    const oldAvatar = user.avatar;
    try {
      console.log("file", file);
      const fileStream = Stream.Readable.from(
        require("fs").createReadStream(file.path)
      );
      await this.cloudService.uploadStreamFile(
        "public/" + file.filename,
        fileStream,
        file.mimetype
      );
      await this.fileRepository.insert({
        fileId: "public/" + file.filename,
        mimeType: file.mimetype,
      });
    } catch (error) {
      console.error("Error while uploading file to S3:", error);
      return Result.badRequest("FILE_UPLOAD_FAILED");
    }
    user.avatar = "public/" + file.filename;
    const updatedUser = await this.userRepository.update(userId, user);
    if (updatedUser.affected === 0) {
      user.avatar = oldAvatar;
      return Result.notFound("USER_NOT_FOUND");
    }
    if (oldAvatar) {
      const fileToDelete = await this.fileRepository.findOneBy({
        fileId: oldAvatar,
      });
      if (fileToDelete) {
        await this.fileRepository.delete(fileToDelete.fileId);
      }
      await this.cloudService.deleteFile(oldAvatar);
    }
    return Result.Ok({});
  }

  async changeMyProfile(
    userId: number,
    changeData: ChangeMyBaseProfileRequest
  ) {
    const user = await this.userRepository.findOneBy({
      userId: userId,
    });
    if (!user) {
      return Result.notFound("USER_NOT_FOUND");
    }
    if (changeData.birthday) {
      user.birthday = new Date(changeData.birthday);
    }
    if (changeData.fullName) {
      user.fullName = changeData.fullName;
    }
    if (changeData.gender) {
      user.gender = changeData.gender;
    }
    if (changeData.bio) {
      user.bio = changeData.bio;
    }
    if (changeData.country) {
      user.country = changeData.country;
    }

    const updatedUser = await this.userRepository.update(userId, user);

    if (updatedUser.affected === 0) {
      return Result.notFound("USER_NOT_FOUND");
    }

    return Result.Ok(updatedUser);
  }

  async getMyProfile(userId: number) {
    const user = await this.userRepository.findOne({
      where: { userId: userId },
      relations: { avatarFile: true },
    });

    if (!user) {
      return Result.notFound("USER_NOT_FOUND");
    }
    if (user.avatar) {
      user.avatar = await this.cloudService.getFilePreSignerUrl(user.avatar);
      console.log(user.avatar);
    }
    if ("password" in user && user.hasOwnProperty("password")) {
      delete (user as { password?: string }).password;
    }
    return Result.Ok(user);
  }

  async searchUsers(userName: string, phone: string) {
    const user = await this.userRepository.findOne({
      where: [{ userName: userName }, { phone: phone }],
    });

    if (!user) {
      return Result.notFound("USER_NOT_FOUND");
    }
    return Result.Ok(user);
  }

  async acceptFriendRequest(userId: number, targetUserId: number) {
    const relationship = await this.relationshipRepository.findOneBy({
      requesterId: targetUserId,
      addresseeId: userId,
      relationType: RelationType.Pending,
    });
    if (!relationship) {
      return Result.notFound("RELATIONSHIP_NOT_FOUND");
    }
    relationship.relationType = RelationType.Friend;
    await this.relationshipRepository.save(relationship);
    return Result.Ok({});
  }

  async rejectFriendRequest(userId: number, targetUserId: number) {
    const relationship = await this.relationshipRepository.findOneBy({
      requesterId: targetUserId,
      addresseeId: userId,
      relationType: RelationType.Pending,
    });
    if (!relationship) {
      return Result.notFound("RELATIONSHIP_NOT_FOUND");
    }
    await this.relationshipRepository.delete(relationship.relationshipId);
    return Result.Ok({});
  }

  async cancelMyFriendRequestSent(userId: number, targetUserId: number) {
    const relationship = await this.relationshipRepository.findOneBy({
      addresseeId: targetUserId,
      requesterId: userId,
      relationType: RelationType.Pending,
    });
    if (!relationship) {
      return Result.notFound("RELATIONSHIP_NOT_FOUND");
    }
    await this.relationshipRepository.delete(relationship.relationshipId);
    return Result.Ok({});
  }

  async removeFriend(userId: number, targetUserId: number) {
    const relationship = await this.relationshipRepository.findOneBy([
      {
        addresseeId: targetUserId,
        requesterId: userId,
        relationType: RelationType.Friend,
      },
      {
        requesterId: targetUserId,
        addresseeId: userId,
        relationType: RelationType.Friend,
      },
    ]);
    if (!relationship) {
      return Result.notFound("RELATIONSHIP_NOT_FOUND");
    }
    await this.relationshipRepository.delete(relationship.relationshipId);
    return Result.Ok({});
  }

  async blockUser(userId: number, targetUserId: number) {
    const relationship = await this.relationshipRepository.findOneBy([
      {
        requesterId: userId,
        addresseeId: targetUserId,
      },
      {
        requesterId: targetUserId,
        addresseeId: userId,
      },
    ]);

    if (relationship) {
      await this.relationshipRepository.delete(relationship.relationshipId);
    }

    await this.relationshipRepository.save({
      requesterId: userId,
      addresseeId: targetUserId,
      relationType: RelationType.Block,
    });

    return Result.Ok({});
  }

  async unblockUser(userId: number, targetUserId: number) {
    const relationship = await this.relationshipRepository.findOneBy({
      addresseeId: targetUserId,
      requesterId: userId,
      relationType: RelationType.Block,
    });
    if (!relationship) {
      return Result.notFound("RELATIONSHIP_NOT_FOUND");
    }
    await this.relationshipRepository.delete(relationship.relationshipId);
    return Result.Ok({});
  }
}
