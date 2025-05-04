import UserRepository from "../infras/data/repository/user.repository";
import { Result } from "../web/utils/result";

export default class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async login(identifier: string, password: string, deviceLoginInfor: string) {
    let user = await this.userRepository.findOne({
      where: { phone: identifier, password },
    });

    if (user != null) {
      return Result.success(user);
    }

    user = await this.userRepository.findOne({
      where: { email: identifier, password },
    });

    if (user != null) {
      return Result.success(user);
    }

    user = await this.userRepository.findOne({
      where: { userName: identifier, password },
    });

    if (user != null) {
      return Result.success(user);
    }
    return Result.fail("INVALID_INFORMATION_LOGIN");
  }

  logout(userId: Number): void {}
}
