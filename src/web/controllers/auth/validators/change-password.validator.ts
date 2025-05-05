import { body } from "express-validator";

export const changePasswordValidator = [
  body("oldPassword").notEmpty().withMessage("Old password is required."),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required.")
    .isLength({ min: 8, max: 40 })
    .withMessage("Password must be between 8 and 255 characters.")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter.")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter.")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number.")
    .matches(/[^a-zA-Z0-9]/)
    .withMessage("Password must contain at least one special character."),
];
