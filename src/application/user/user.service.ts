import UserRepository from "../../infras/data/repository/user.repository";
import { GoogleOAuthHelper } from "../../infras/google-auth/google-oauth-helper";
import { ConfigService } from "../../shared-kernel/env/config-service";
import { ChangeMyBaseProfileRequest } from "../../web/controllers/user/req/change-base-profile.req";
import removeUploadFile from "../../web/utils/remove-upload-file";
import { Result } from "../../web/utils/result";

export default class UserService {
  private ggHelper: GoogleOAuthHelper;
  private userRepository: UserRepository;
  constructor() {
    this.ggHelper = new GoogleOAuthHelper({
      ClientId: ConfigService.tryGet("GOOGLE_CLIENT_ID"),
      ClientSecret: ConfigService.tryGet("GOOGLE_CLIENT_SECRET"),
      RedirectUri: ConfigService.tryGet("GOOGLE_REDIRECT_URI"),
    });
    this.userRepository = new UserRepository();
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
    user.avatar = file.filename;
    const updatedUser = await this.userRepository.update(userId, user);
    if (updatedUser.affected === 0) {
      user.avatar = oldAvatar;
      return Result.notFound("USER_NOT_FOUND");
    }
    if (oldAvatar) {
      removeUploadFile(oldAvatar);
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
    const user = await this.userRepository.findOneBy({
      userId: userId,
    });
    if (!user) {
      return Result.notFound("USER_NOT_FOUND");
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
}
