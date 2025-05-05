import { JwtPayload } from "jsonwebtoken";

export default interface PayloadData extends JwtPayload {
  userId: number;
  phoneNumber: string;
}
