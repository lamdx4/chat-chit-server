import { Router } from "express";

export default abstract class BaseController {
  constructor(protected router: Router) {}

  public abstract initRoutes(): void;

  public getRouter(): Router {
    return this.router;
  }
}
