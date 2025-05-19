import { body } from "express-validator";

const createGroupValidator = [
  body("name").isString().notEmpty(),
  body("members")
    .isArray({ min: 2 })
    .withMessage("At least 2 members are required"),
  body("members")
    .custom(
      (members) =>
        Array.isArray(members) &&
        members.every((id: unknown) => typeof id === "number")
    )
    .withMessage("Members must be an array of numbers"),
  body("name")
    .isLength({ min: 7 })
    .withMessage("Group name must be at least 7 characters long"),
];
export default createGroupValidator;
