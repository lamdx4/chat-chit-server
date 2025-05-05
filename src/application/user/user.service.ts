import UserRepository from "../../infras/data/repository/user.repository";
import { ChangeMyBaseProfileRequest } from "../../web/controllers/user/req/change-base-profile.req";
import { Result } from "../../web/utils/result";

export default class UserService {
  private userRepository: UserRepository;
  constructor() {
    this.userRepository = new UserRepository();
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
