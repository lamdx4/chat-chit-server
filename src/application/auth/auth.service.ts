import { User } from "../../core/entities/user.entity";
import UserRepository from "../../infras/data/repository/user.repository";
import JwtProvider from "../../infras/jwt/jwt-provider";
import { Result } from "../../web/utils/result";

export default class AuthService {
  private userRepository: UserRepository;

  private jwtService: JwtProvider;

  constructor() {
    this.userRepository = new UserRepository();
    this.jwtService = new JwtProvider();
  }

  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string
  ) {
    const user = await this.userRepository.findOne({
      where: { userId, password: oldPassword },
    });
    if (user == null) {
      return Result.badRequest("PASSWORD_NOT_MATCH");
    }
    user.password = newPassword;
    await this.userRepository.save(user);
    return Result.Ok(user);
  }

  async register(
    phone: string,
    fullName: string,
    password: string,
    userName: string
  ) {
    const isPhoneExist = await this.userRepository.findOne({
      where: { phone },
    });
    if (isPhoneExist != null) {
      return Result.badRequest("PHONE_IS_ALREADY_EXISTED");
    }
    const isUserNameExist = await this.userRepository.findOne({
      where: { userName },
    });
    if (isUserNameExist != null) {
      return Result.badRequest("USERNAME_IS_ALREADY_EXISTED");
    }
    const user = new User();
    user.phone = phone;
    user.fullName = fullName;
    user.password = password;
    user.userName = userName;
    user.createdAt = new Date();
    await this.userRepository.save(user);
    return Result.Ok(user);
  }

  async login(identifier: string, password: string, deviceLoginInfo: string) {
    let user = await this.userRepository.findOne({
      where: { phone: identifier, password },
    });

    if (!user) {
      user = await this.userRepository.findOne({
        where: { email: identifier, password },
      });
    }

    if (!user) {
      user = await this.userRepository.findOne({
        where: { userName: identifier, password },
      });
    }

    if (user) {
      const token = this.jwtService.generateToken({
        userId: user.userId,
        phoneNumber: user.phone,
      });

      return Result.Ok({
        user,
        token,
      });
    }

    return Result.badRequest("INVALID_INFORMATION_LOGIN");
  }

  logout(userId: number): void {}

  async refreshToken(token: string) {
    const decoded = await this.jwtService.decodeRefreshToken(token);
    if (decoded) {
      const user = await this.userRepository.findOne({
        where: { userId: decoded.userId },
      });
      if (user) {
        const newToken = this.jwtService.generateAccessToken({
          userId: user.userId,
          phoneNumber: user.phone,
        });
        return Result.Ok({ accessToken: newToken });
      }
    }
    return Result.badRequest("INVALID_TOKEN");
  }
}
