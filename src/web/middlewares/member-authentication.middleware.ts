import { NextFunction, Request, Response } from "express";
import JwtProvider from "../../infras/jwt/jwt-provider";
import { ResponseData } from "../utils/response-data";

export default async function memberAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const jwtService = new JwtProvider();
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    res.status(401).json(ResponseData.fail("UNAUTHORIZED"));
    return;
  }
  const decoded = await jwtService.decodeAccessToken(token);
  if (decoded) {
    req.userId = decoded.userId;
    next();
  } else {
    res.status(401).json(ResponseData.fail("UNAUTHORIZED"));
  }
}
