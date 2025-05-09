import { Expose } from "class-transformer";

export class UserDto {
  @Expose()
  userId: number;
  @Expose()
  avatar: string;
  @Expose()
  email?: string;
  @Expose()
  phone: string;
  @Expose()
  birthday: Date;
  @Expose()
  fullName: string;
  @Expose()
  gender: string;
  @Expose()
  bio: string;
  @Expose()
  userName: string;
  @Expose()
  country: string;
  @Expose()
  googleAccountId: string;
}
