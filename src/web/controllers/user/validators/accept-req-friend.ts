import { body } from "express-validator";

const acceptFriendRequestValidator = [
  body("targetUserId")
    .exists()
    .withMessage("targetUserId is required")
    .isNumeric(),
];
export default acceptFriendRequestValidator;