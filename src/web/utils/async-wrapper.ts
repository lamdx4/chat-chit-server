import { Request, Response, NextFunction, RequestHandler } from "express";

const asyncUtil = (
  fn: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<unknown> | unknown
): RequestHandler =>
  function asyncUtilWrap(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export default asyncUtil;
