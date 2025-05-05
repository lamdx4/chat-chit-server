import { body } from "express-validator";

const changeBaseProfileValidator = [
  body("birthday")
    .optional()
    .isISO8601()
    .withMessage("Birthday must be a valid date")
    .custom((value) => {
      const birthday = new Date(value);
      const minDate = new Date();
      minDate.setFullYear(minDate.getFullYear() - 13);
      if (birthday > minDate) {
        throw new Error("You must be at least 13 years old");
      }
      return true;
    }),

  body("fullName")
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage("FullName must be between 3 and 100 characters"),

  body("gender")
    .optional()
    .isIn(["Male", "Female"])
    .withMessage("Gender must be either 'Male', 'Female'"),

  body("bio")
    .optional()
    .isLength({ max: 255 })
    .withMessage("Bio must be at most 255 characters"),

  body("country")
    .optional()
    .notEmpty()
    .withMessage("Country must not be empty"),
];
export default changeBaseProfileValidator;
