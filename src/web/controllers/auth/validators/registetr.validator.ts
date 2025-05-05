import { body } from "express-validator";

const registerValidator = [
  body("phone")
    .notEmpty()
    .withMessage("Phone number is required")
    .not()
    .isEmpty()
    .withMessage("Phone number is required"),

  body("fullName")
    .isLength({ min: 3, max: 100 })
    .withMessage("First name cannot exceed 200 characters"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8, max: 40 })
    .withMessage("Password must be between 8 and 255 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[^a-zA-Z0-9]/)
    .withMessage("Password must contain at least one special character"),

  body("userName")
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-z0-9]+$/)
    .withMessage("Username can only contain lowercase letters and numbers"),
];
export default registerValidator;