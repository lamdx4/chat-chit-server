import { Socket } from "socket.io";
import JwtProvider from "../../infras/jwt/jwt-provider";

export default async function authenticateForSocketMiddleware(
  socket: Socket,
  next: Function
) {
  const jwtService = new JwtProvider();
  const token =
    socket.handshake.auth["authorization"]?.split(" ")[1] ||
    socket.handshake.headers["authorization"]?.split(" ")[1];
  if (token) {
    const decoded = await jwtService.decodeAccessToken(token);
    if (decoded) {
      socket.data.userId = decoded.userId;
      next();
      return;
    }
  }
  next(new Error("UNAUTHORIZED"));
}
