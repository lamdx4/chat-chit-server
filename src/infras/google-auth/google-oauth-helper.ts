import axios, { AxiosInstance } from "axios";
import jwt, { JwtHeader, JwtPayload } from "jsonwebtoken";
import { JwksClient, JwksError, SigningKey } from "jwks-rsa";
import { URLSearchParams } from "url";
import { ConfigService } from "../../shared-kernel/env/config-service";

// Interfaces tương ứng với C# DTOs
export interface GoogleOAuth2Setting {
  ClientId: string;
  ClientSecret: string;
  RedirectUri: string;
}

export interface TokenResponse {
  AccessToken: string;
  IdToken: string;
}

export interface GoogleUserInfo {
  AccountId: string;
  Email: string;
  Name: string;
}

export class GoogleOAuthHelper {
  private static readonly httpClient: AxiosInstance = axios.create();
  private readonly jwksClient: JwksClient;

  constructor(private readonly options: GoogleOAuth2Setting) {
    this.jwksClient = new JwksClient({
      jwksUri: "https://www.googleapis.com/oauth2/v3/certs",
    });
  }

  public async getUserInfoFromCodeAsync(code: string): Promise<GoogleUserInfo> {
    const tokenResponse = await this.exchangeCodeForTokensAsync(code);

    if (!tokenResponse.IdToken) {
      throw new Error("No id_token returned from Google.");
    }

    return this.validateAndParseIdTokenAsync(tokenResponse.IdToken);
  }

  private async exchangeCodeForTokensAsync(
    code: string
  ): Promise<TokenResponse> {
    const params = new URLSearchParams({
      code,
      client_id: this.options.ClientId,
      client_secret: this.options.ClientSecret,
      redirect_uri: this.options.RedirectUri,
      grant_type: "authorization_code",
    });

    const response = await GoogleOAuthHelper.httpClient.post<TokenResponse>(
      "https://oauth2.googleapis.com/token",
      params.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (response.status !== 200) {
      throw new Error(
        `Failed to exchange code: ${JSON.stringify(response.data)}`
      );
    }

    return {
      AccessToken: response.data.AccessToken,
      IdToken: response.data.IdToken,
    };
  }

  private async validateAndParseIdTokenAsync(
    idToken: string
  ): Promise<GoogleUserInfo> {
    const getKey = (
      header: JwtHeader,
      callback: (error: Error | null, signingKey?: jwt.Secret) => void
    ) => {
      if (!header.kid) {
        return callback(new Error("No kid in token header"));
      }

      this.jwksClient.getSigningKey(
        header.kid,
        (err: Error | null, key?: SigningKey) => {
          if (err) {
            return callback(new JwksError(err.message));
          }
          if (!key) {
            return callback(new JwksError("Signing key not found"));
          }

          try {
            const signingKey = key.getPublicKey();
            callback(null, signingKey);
          } catch (e) {
            callback(e as Error);
          }
        }
      );
    };

    const decoded = await new Promise<JwtPayload>((resolve, reject) => {
      jwt.verify(
        idToken,
        getKey,
        {
          audience: this.options.ClientId,
          issuer: "https://accounts.google.com",
          algorithms: ["RS256"],
          clockTolerance: 120, // Tương đương ClockSkew trong C#
        },
        (err, decoded) => {
          if (err) return reject(err);
          resolve(decoded as JwtPayload);
        }
      );
    });

    const accountId = decoded.sub;
    const email = decoded.email;
    const name = decoded.name;

    if (!accountId || !email || !name) {
      throw new Error("Invalid id_token payload");
    }

    return {
      AccountId: accountId,
      Email: email,
      Name: name,
    };
  }
}

// Utility class cho GoogleOAuth2Setting
export class GoogleOAuth2Config implements GoogleOAuth2Setting {
  ClientId: string;
  ClientSecret: string;
  RedirectUri: string;

  constructor() {
    this.ClientId = ConfigService.tryGet("GOOGLE_CLIENT_ID");
    this.ClientSecret = ConfigService.tryGet("GOOGLE_CLIENT_SECRET");
    this.RedirectUri = ConfigService.tryGet("GOOGLE_REDIRECT_URI");
  }

  public getRedirectUri(userId: number): string {
    const params = new URLSearchParams({
      client_id: this.ClientId,
      redirect_uri: this.RedirectUri,
      response_type: "code",
      scope: "profile email",
      state: userId.toString(),
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }
}
