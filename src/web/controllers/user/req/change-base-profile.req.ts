import { GenderType } from "../../../../core/entities/user.entity";

export interface ChangeMyBaseProfileRequest {
  birthday?: Date;
  fullName: string;
  gender: GenderType;
  bio?: string;
  country: string;
}
