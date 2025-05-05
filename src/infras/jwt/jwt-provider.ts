import jwt, { SignOptions, VerifyOptions, JwtPayload } from "jsonwebtoken";
import PayloadData from "./payload/payload-data";
import { ConfigService } from "../../shared-kernel/env/config-service";

export interface JwtSetting {
  ValidIssuer: string;
  ValidAudience: string;
  AccessTokenSecret: string;
  RefreshTokenSecret: string;
  AccessTokenExpiration: number; // in hours
  RefreshTokenExpiration: number; // in days
}

export interface TokenDto {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

/**
 * JWT Provider: Tạo, xác thực và giải mã Access Token và Refresh Token cho hệ thống.
 * Sử dụng các thiết lập từ biến môi trường để cấu hình.
 */
/**
 * Provides JWT (JSON Web Token) generation and validation utilities.
 * Handles creation, verification, and decoding of access and refresh tokens for user authentication.
 */
export default class JwtProvider {
  /**
   * JWT configuration settings loaded from environment variables.
   */
  private jwtSetting: JwtSetting;

  /**
   * Initializes a new instance of
   */
  constructor() {
    this.jwtSetting = {
      ValidIssuer: ConfigService.tryGet("JWT_ISSUER"),
      ValidAudience: ConfigService.tryGet("JWT_AUDIENCE"),
      AccessTokenSecret: ConfigService.tryGet("JWT_ACCESS_TOKEN_SECRET"),
      RefreshTokenSecret: ConfigService.tryGet("JWT_REFRESH_TOKEN_SECRET"),
      AccessTokenExpiration: parseInt(
        ConfigService.tryGet("JWT_ACCESS_TOKEN_EXPIRATION")
      ), // in hours
      RefreshTokenExpiration: parseInt(
        ConfigService.tryGet("JWT_REFRESH_TOKEN_EXPIRATION")
      ), // in days
    };
  }

  /**
   * Generates a new pair of accessToken and refreshToken for the user.
   * @param payload - User information (userId, phoneNumber).
   * @returns TokenDto object containing accessToken, refreshToken, and refreshToken expiration time.
   */
  generateToken(payload: PayloadData): TokenDto {
    const { tokenString: refreshToken, expiresAt } =
      this.generateRefreshToken(payload);
    const accessToken = this.generateAccessToken(payload);
    return {
      accessToken,
      refreshToken,
      refreshTokenExpiresAt: expiresAt,
    };
  }

  /**
   * Checks the validity of the refreshToken.
   * @param token - The refreshToken string.
   * @returns Promise that resolves to true if valid, otherwise false.
   */
  async validateRefreshToken(token: string): Promise<boolean> {
    try {
      const payload = jwt.verify(token, this.jwtSetting.RefreshTokenSecret, {
        issuer: this.jwtSetting.ValidIssuer,
        audience: this.jwtSetting.ValidAudience,
      } as VerifyOptions) as JwtPayload;

      return !!(payload["phoneNumber"] && payload["userId"]);
    } catch {
      return false;
    }
  }

  /**
   * Generates a refreshToken for the user.
   * @param payload - User information (userId, phoneNumber).
   * @returns An object containing the token string and its expiration time.
   */
  generateRefreshToken(payload: PayloadData): {
    tokenString: string;
    expiresAt: Date;
  } {
    const expiresIn = this.jwtSetting.RefreshTokenExpiration * 24 * 60 * 60; // days to seconds
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    const options: SignOptions = {
      issuer: this.jwtSetting.ValidIssuer,
      audience: this.jwtSetting.ValidAudience,
      expiresIn,
    };
    const tokenString = jwt.sign(
      payload,
      this.jwtSetting.RefreshTokenSecret,
      options
    );
    return { tokenString, expiresAt };
  }

  /**
   * Generates an accessToken for the user.
   * @param payload - User information (userId, phoneNumber).
   * @returns The accessToken string.
   */
  generateAccessToken(payload: PayloadData): string {
    const expiresIn = this.jwtSetting.AccessTokenExpiration * 60 * 60; // hours to seconds
    const options: SignOptions = {
      issuer: this.jwtSetting.ValidIssuer,
      audience: this.jwtSetting.ValidAudience,
      expiresIn,
    };
    return jwt.sign(payload, this.jwtSetting.AccessTokenSecret, options);
  }

  /**
   * Decodes and validates the refreshToken.
   * @param token - The refreshToken string.
   * @returns Promise that resolves to PayloadData if valid, otherwise null.
   */
  async decodeRefreshToken(token: string): Promise<PayloadData | null> {
    try {
      const payload = jwt.verify(token, this.jwtSetting.RefreshTokenSecret, {
        issuer: this.jwtSetting.ValidIssuer,
        audience: this.jwtSetting.ValidAudience,
      }) as JwtPayload;

      if (
        typeof payload === "object" &&
        typeof payload.userId === "number" &&
        typeof payload.phoneNumber === "string"
      ) {
        return { userId: payload.userId, phoneNumber: payload.phoneNumber };
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Decodes and validates the accessToken.
   * @param token - The accessToken string.
   * @returns Promise that resolves to PayloadData if valid, otherwise null.
   */
  async decodeAccessToken(token: string): Promise<PayloadData | null> {
    try {
      const payload = jwt.verify(token, this.jwtSetting.AccessTokenSecret, {
        issuer: this.jwtSetting.ValidIssuer,
        audience: this.jwtSetting.ValidAudience,
      } as VerifyOptions) as JwtPayload;

      if (
        typeof payload === "object" &&
        typeof payload.userId === "number" &&
        typeof payload.phoneNumber === "string"
      ) {
        return { userId: payload.userId, phoneNumber: payload.phoneNumber };
      }
      return null;
    } catch {
      return null;
    }
  }
}
