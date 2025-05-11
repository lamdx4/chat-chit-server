import { body } from "express-validator";

const getNewAccessTokenValidator = [
  body("refreshToken")
    .exists()
    .withMessage("refreshToken is required")
    .isString()
    .withMessage("refreshToken must be a string")
    .notEmpty()
    .withMessage("refreshToken must not be empty"),
];
export default getNewAccessTokenValidator;
