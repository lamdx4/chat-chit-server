// src/web/controllers/story/validators/create-story.validator.ts

import { body } from "express-validator";

/**
 * Validator for creating a new story.
 * - text: optional, string, max 255 characters
 * - visibility: optional, must be 0 (Public), 1 (Friends), or 2 (Private)
 */
const createStoryValidator = [
  body("text")
    .optional()
    .isString()
    .isLength({ max: 255 })
    .withMessage("Text must be a string with at most 255 characters."),

  body("visibility")
    .optional()
    .isInt({ min: 0, max: 2 })
    .withMessage("Visibility must be one of: 0 (Public), 1 (Friends), 2 (Private)."),
];

export default createStoryValidator;
