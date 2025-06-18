export enum SocketIoEvent {
  NEW_MESSAGE = "new-message",
  NEW_GROUP = "new-group",
  RENAME_GROUP = "rename-group",
  CHANGE_GROUP_AVATAR = "change-group-avatar",
  NEW_VOTE_FOR_POLL = "new-vote-for-poll",
  VIEW_NEW_MESSAGE = "view-new-message",
  CHANGE_AVATAR_GROUP = "change-avatar-group",
  MEMBER_VOTE_POLL = "member-vote-poll",
  CHANGE_EMOJI_AVATAR = "change-emoji-avatar",
  REACT_MESSAGE = "react-message",
}
export function getGroupRoom(roomId: number | string): string {
  return `room-${roomId}`;
}
export function getPersonalRoom(roomId: number | string): string {
  return `user-${roomId}`;
}
