export class GoogleOAuth2Setting {
  public clientId: string;
  public clientSecret: string;
  public redirectUri: string;

  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
  }

  public getRedirectUri(userId: number): string {
    return (
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${this.clientId}` +
      `&redirect_uri=${this.redirectUri}` +
      `&response_type=code` +
      `&scope=profile%20email` +
      `&state=${userId}`
    );
  }
}

export interface TokenResponse {
  accessToken: string;
  idToken: string;
}

export class GoogleUserInfo {
  public accountId: string;
  public email: string;
  public name: string;

  constructor(accountId: string, email: string, name: string) {
    this.accountId = accountId;
    this.email = email;
    this.name = name;
  }
}
