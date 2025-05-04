import { EntityTarget, ObjectLiteral, Repository } from "typeorm";
import AppDataSource from "../data-source/data-source";

export class BaseRepository<T extends ObjectLiteral> extends Repository<T> {
  constructor(entity: EntityTarget<T>) {
    super(entity, AppDataSource.manager);
  }
}
