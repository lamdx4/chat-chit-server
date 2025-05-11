import { param } from "express-validator";

const getRelationshipValidator = [
  param("targetUserId")
    .exists()
    .withMessage("targetUserId is required")
    .isNumeric(),
];
export default getRelationshipValidator;
