import { Relationship } from "../../../core/entities/relationship.entity";
import { BaseRepository } from "./base.repository";

export default class RelationshipRepository extends BaseRepository<Relationship> {
    constructor() {
        super(Relationship);
    }
}
