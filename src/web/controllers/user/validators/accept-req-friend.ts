import { body } from "express-validator";

const acceptFriendRequestValidator = [
  body("targeUserId")
    .exists()
    .withMessage("targeUserId is required")
    .isNumeric(),
];
export default acceptFriendRequestValidator;