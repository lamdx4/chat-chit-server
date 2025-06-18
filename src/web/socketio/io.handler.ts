import { Socket } from "socket.io";
import { getGroupRoom } from "./event.constant";
import GroupService from "../../application/group/group.service";

const groupService = new GroupService();

export default function handlerIO(socket: Socket) {
  socket.on("joinGroup", async (groupId: number) => {
    if (
      await groupService
        .isUserInGroup(socket.data.userId, groupId)
        .then((res) => !res.isSuccess)
    ) {
      socket.join(getGroupRoom(groupId));
    }
  });
}
