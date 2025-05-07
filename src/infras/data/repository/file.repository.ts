import { File } from "../../../core/entities/file.entity";
import { BaseRepository } from "./base.repository";

export default class FileRepository extends BaseRepository<File> {
  constructor() {
    super(File);
  }
}
