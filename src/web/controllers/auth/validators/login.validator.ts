import { body } from "express-validator";

const loginValidator = [
  body("identifier").exists().withMessage("Phone number or username or email is required"),
  body("password").exists().withMessage("Password is required"),
];
export default loginValidator;
