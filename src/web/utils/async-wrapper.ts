import { Request, Response, NextFunction, RequestHandler } from "express";

const asyncUtil = <Req = Request, Res = Response, Next = NextFunction>(
  fn: (req: Req, res: Res, next: Next) => Promise<unknown>
): RequestHandler =>
  function asyncUtilWrap(req, res, next) {
    Promise.resolve(fn(req as Req, res as Res, next as Next)).catch(next);
  };

export default asyncUtil;
