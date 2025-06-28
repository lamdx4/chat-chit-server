import { User } from "../../core/entities/user.entity";
import UserRepository from "../../infras/data/repository/user.repository";
import {
  ActionGetCodeType,
  GoogleOAuthHelper,
  GoogleUserInfo,
} from "../../infras/google-auth/google-oauth-helper";
import JwtProvider from "../../infras/jwt/jwt-provider";
import { ConfigService } from "../../shared-kernel/env/config-service";
import logger from "../../shared-kernel/logger/logger";
import { Result } from "../../web/utils/result";

export default class AuthService {
  private userRepository: UserRepository;
  private ggHelper: GoogleOAuthHelper;
  private jwtService: JwtProvider;

  constructor() {
    this.userRepository = new UserRepository();
    this.jwtService = new JwtProvider();
    this.ggHelper = new GoogleOAuthHelper({
      ClientId: ConfigService.tryGet("GOOGLE_CLIENT_ID"),
      ClientSecret: ConfigService.tryGet("GOOGLE_CLIENT_SECRET"),
      RedirectLinkAccountUri: ConfigService.tryGet(
        "GOOGLE_REDIRECT_LINK_ACCOUNT_URI"
      ),
      RedirectLoginUri: ConfigService.tryGet("GOOGLE_REDIRECT_LOGIN_URI"),
    });
  }

  async loginWithGoogle(code: string, deviceLoginInfor: string) {
    let token: GoogleUserInfo;
    try {
      token = await this.ggHelper.getGoogleUserInfoFromCodeAsync(
        code,
        ActionGetCodeType.Login
      );
      let user = await this.userRepository.findOne({
        where: { email: token.email, googleAccountId: token.account_id },
      });
      if (user) {
        const jwtToken = this.jwtService.generateToken({
          userId: user.userId,
          phoneNumber: user.phone,
        });
        return Result.ok({
          user,
          token: jwtToken,
        });
      } else {
        return Result.badRequest("INVALID_GOOGLE_ACCOUNT");
      }
    } catch (error) {
      logger.error("Error while getting user info from Google:", error);
      return Result.badRequest("INVALID_CODE");
    }
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
    return Result.ok(user);
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
    return Result.ok(user);
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

      return Result.ok({
        user,
        token,
      });
    }

    return Result.badRequest("INVALID_INFORMATION_LOGIN");
  }

  async getLoginUri() {
    return Result.ok({
      url: await this.ggHelper.getRedirectLoginUri(),
    });
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
        return Result.ok({ accessToken: newToken });
      }
    }
    return Result.badRequest("INVALID_TOKEN");
  }
}
