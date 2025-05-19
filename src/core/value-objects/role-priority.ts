import { MemberRole } from "../entities/group-role.entity";

const RolePriority: Record<MemberRole, number> = {
  [MemberRole.Admin]: 2,
  [MemberRole.Owner]: 3,
  [MemberRole.Member]: 1,
};
export default RolePriority;
