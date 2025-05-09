import { query } from "express-validator";

const cursorPagValidator = [
  query("cursor")
    .exists()
    .withMessage("Cursor must be exist")
    .isNumeric()
    .withMessage("Cursor must be number"),
  query("limit")
    .optional()
    .isNumeric()
    .withMessage("Limit must be number")
    .custom((value) => Number(value) > 0)
    .withMessage("Limit must be more than 0"),
];
export default cursorPagValidator;
