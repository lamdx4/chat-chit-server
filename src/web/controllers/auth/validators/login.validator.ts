import { body } from "express-validator";

const loginValidator = [
  body("identifier")
    .exists()
    .withMessage("Phone number is required")
    .isMobilePhone("any")
    .withMessage("Invalid phone number format"),
  body("password").exists().withMessage("Password is required"),
];
export default loginValidator;
